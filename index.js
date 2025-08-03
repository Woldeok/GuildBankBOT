const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();
const pool = require('./database.js');
const updateStockPrices = require('./update_stock_prices.js');
const { checkAndCollectOverdueLoans } = require('./tasks/overdueLoanChecker.js');
const { backupDatabase } = require('./tasks/backupDatabase.js');
const collectDailyTax = require('./tasks/dailyTaxCollection.js');
const { guildAutoTradeStocks } = require('./tasks/guildStockTrader.js'); // Add this line
const cron = require('node-cron');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

client.commands = new Collection();
client.commandCount = 0; // 명령어 실행 횟수 초기화
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  } catch (error) {
    console.error(`명령어 로드 중 오류 발생: ${filePath}`, error);
  }
}

client.once('ready', () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  // 주식 가격 업데이트 스케줄러 시작 (1분마다 실행)
  setInterval(() => updateStockPrices(client), 60 * 1000);

  // 연체 대출 확인 및 압류 스케줄러 시작 (매일 자정 실행)
  cron.schedule('0 0 * * *', () => {
    console.log('연체 대출 확인 및 회수 실행 중...');
    checkAndCollectOverdueLoans();
  });
  checkAndCollectOverdueLoans(); // 봇 시작 시 한 번 실행

  // 데이터베이스 백업 스케줄러 시작 (매일 자정 실행)
  cron.schedule('0 0 * * *', () => {
    console.log('Running database backup...');
    backupDatabase();
  });
  backupDatabase(); // 봇 시작 시 한 번 실행

  // Daily tax collection scheduler (매일 자정 실행)
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily tax collection...');
    collectDailyTax();
  });
  collectDailyTax(); // 봇 시작 시 한 번 실행

  // 길드 자동 주식 거래 스케줄러 시작 (매일 자정 실행)
  cron.schedule('0 0 * * *', () => {
    console.log('Running guild auto stock trading...');
    guildAutoTradeStocks(client);
  });
  guildAutoTradeStocks(client); // 봇 시작 시 한 번 실행
});

client.on('messageCreate', async message => {
    // 봇이 보낸 메시지이거나 DM이 아니면 무시
    if (message.author.bot || message.channel.type !== ChannelType.DM) {
        return;
    }

    // 관리자만 DM 명령어를 사용할 수 있도록 확인
    const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
    if (!ADMIN_IDS.includes(message.author.id)) {
        return;
    }

    const args = message.content.trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === '매수' || commandName === '매도') {
        const stockSymbol = args[0];
        const quantity = parseInt(args[1], 10);

        if (!stockSymbol || !quantity || isNaN(quantity) || quantity <= 0) {
            return message.reply('잘못된 형식입니다. `매수 [심볼] [수량]` 또는 `매도 [심볼] [수량]` 형식으로 입력해주세요.');
        }

        // interaction 객체를 모방하여 명령어 실행
        const mockInteraction = {
            user: message.author,
            options: {
                getString: (name) => {
                    if (name === 'stock') return stockSymbol;
                },
                getString: (name) => { // Changed to getString for quantity
                    if (name === '수량') return quantity.toString(); // Convert to string
                },
            },
            reply: async (options) => {
                // DM에서는 deferReply가 필요 없으므로 바로 메시지 전송
                return message.reply(options);
            },
            deferReply: async (options) => {
                // DM에서는 deferReply가 필요 없으므로 아무것도 하지 않음
                return;
            }, 
            editReply: async (options) => {
                // DM에서는 edit 대신 새 메시지 전송
                return message.reply(options);
            }
        };

        const command = client.commands.get(commandName === '매수' ? '주식매수' : '주식매도');
        if (!command) {
            return message.reply('해당 명령어를 찾을 수 없습니다.');
        }

        try {
            await command.execute(mockInteraction);
        } catch (error) {
            console.error('DM 명령어 실행 중 오류:', error);
            message.reply('명령어 실행 중 오류가 발생했습니다.');
        }
    }
});


client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
      client.commandCount++; // 명령어 실행 시 카운트 증가
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  } else if (interaction.isAutocomplete()) {
    console.log(`Autocomplete interaction received for command: ${interaction.commandName}`); // 추가된 로그
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      if (command.autocomplete) {
        await command.autocomplete(interaction);
      } else {
        const focusedOption = interaction.options.getFocused(true);
        console.log(`Autocomplete for option: ${focusedOption.name}, value: ${focusedOption.value}`);

        if (focusedOption.name === 'stock') {
          let stocks;
          if (interaction.commandName === '주식매수') {
            // 주식매수: 모든 주식 목록을 필터링 없이 가져옴
            [stocks] = await pool.query('SELECT name, symbol FROM stocks');
          } else if (interaction.commandName === '주식매도') {
            // 주식매도: 사용자가 보유한 주식만 가져옴 (기존 로직 유지)
            const userId = interaction.user.id;
            [stocks] = await pool.query(
              'SELECT s.name, s.symbol FROM stocks s JOIN user_stocks us ON s.id = us.stock_id WHERE us.user_id = ? AND us.quantity > 0',
              [userId]
            );
          }

          // 사용자가 입력한 값으로 필터링 (선택 사항, 필요시 주석 해제)
          const filteredStocks = stocks.filter(stock => 
            stock.name.includes(focusedOption.value) || 
            stock.symbol.includes(focusedOption.value)
          );

          const choices = filteredStocks.map(stock => ({ name: `${stock.name} (${stock.symbol})`, value: stock.symbol }));
          await interaction.respond(choices.slice(0, 25));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// Start Web Server
const webApp = require('./webserver/app');
const WEB_PORT = process.env.WEB_PORT || 8080;
webApp.listen(WEB_PORT, () => {
    console.log(`웹 서버가 포트 ${WEB_PORT}에서 실행 중입니다.`);
});