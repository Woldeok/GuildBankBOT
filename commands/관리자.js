const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../database');
const { sendGuildBankStatus } = require('../tasks/sendGuildBankStatus');
const os = require('os'); // os 모듈 추가
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

// 관리자 ID를 .env에서 가져옵니다.
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('관리자')
        .setDescription('봇 관리자 명령어입니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Discord 권한 설정 (선택 사항)
        .addSubcommand(subcommand =>
            subcommand
                .setName('정보')
                .setDescription('봇의 서버 및 사용자 정보를 조회합니다.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('주식가격설정')
                .setDescription('특정 주식의 가격을 설정합니다.')
                .addStringOption(option =>
                    option.setName('stock')
                        .setDescription('가격을 설정할 주식의 종목명 또는 심볼')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option => // Changed to StringOption
                    option.setName('price')
                        .setDescription('새로운 주식 가격')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('주식가격초기화')
                .setDescription('모든 주식의 가격을 초기값으로 재설정합니다.')
                .addStringOption(option => // Changed to StringOption
                    option.setName('기본값')
                        .setDescription('모든 주식에 설정할 기본 가격')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('유저잔액설정')
                .setDescription('특정 유저의 잔액을 설정, 추가 또는 차감합니다.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('잔액을 설정할 유저')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('operation')
                        .setDescription('잔액 작업 (설정, 추가, 차감)')
                        .setRequired(true)
                        .addChoices(
                            { name: '설정', value: 'set' },
                            { name: '추가', value: 'add' },
                            { name: '차감', value: 'subtract' },
                        ))
                .addStringOption(option => // Changed to StringOption
                    option.setName('amount')
                        .setDescription('금액')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('국가주식거래')
                .setDescription('국가 은행의 자금으로 주식을 거래합니다.')
                .addStringOption(option =>
                    option.setName('거래')
                        .setDescription('매수 또는 매도')
                        .setRequired(true)
                        .addChoices(
                            { name: '매수', value: 'buy' },
                            { name: '매도', value: 'sell' }
                        ))
                .addStringOption(option =>
                    option.setName('stock')
                        .setDescription('거래할 주식의 종목명 또는 심볼')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option => // Changed to StringOption
                    option.setName('수량')
                        .setDescription('거래할 수량')
                        .setRequired(true))),

    async execute(interaction) {
        // 관리자 권한 확인
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        let connection;
        try {
            connection = await pool.getConnection();

            if (subcommand === '정보') {
                // 봇이 접속 중인 서버 정보
                const guilds = interaction.client.guilds.cache.map(guild => `- ${guild.name} (ID: ${guild.id}, 멤버: ${guild.memberCount}명)`).join('\n');
                const guildCount = interaction.client.guilds.cache.size;

                // 총 사용자 수 (users 테이블 기준)
                const [userCountResult] = await connection.query('SELECT COUNT(DISTINCT id) as totalUsers FROM users');
                const totalUsers = userCountResult[0].totalUsers;

                // 주식을 보유한 사용자 수 (user_stocks 테이블 기준)
                const [stockHoldingUserCountResult] = await connection.query('SELECT COUNT(DISTINCT user_id) as stockHoldingUsers FROM user_stocks');
                const stockHoldingUsers = stockHoldingUserCountResult[0].stockHoldingUsers;

                // 봇 업타임
                let uptimeSeconds = process.uptime();
                const days = Math.floor(uptimeSeconds / (3600 * 24));
                uptimeSeconds %= (3600 * 24);
                const hours = Math.floor(uptimeSeconds / 3600);
                uptimeSeconds %= 3600;
                const minutes = Math.floor(uptimeSeconds / 60);
                const seconds = Math.floor(uptimeSeconds % 60);
                const uptime = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;

                // 메모리 사용량
                const memoryUsage = process.memoryUsage();
                const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2); // Resident Set Size
                const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2); // Heap used

                // Node.js 버전
                const nodeVersion = process.version;

                // Discord.js 버전
                const discordJsVersion = require('discord.js').version;

                // 데이터베이스 연결 상태
                let dbStatus = '연결됨';
                try {
                    await pool.getConnection(); // 연결 시도
                } catch (dbError) {
                    dbStatus = `연결 실패 (${dbError.message})`;
                }

                // Discord API 지연 시간 (Ping)
                const ping = interaction.client.ws.ping;

                // 총 명령어 실행 횟수
                const totalCommandsExecuted = interaction.client.commandCount || 0;

                // 운영체제 정보
                const osType = os.type();
                const osPlatform = os.platform();
                const osRelease = os.release();
                const osArch = os.arch();

                // 프로세스 ID (PID)
                const pid = process.pid;

                await interaction.reply({
                    content: `**봇 정보:**\n\n` +
                             `**접속 중인 서버 (${guildCount}개):**\n${guilds || '없음'}\n\n` +
                             `**총 사용자 수 (봇과 상호작용한 유저):** ${totalUsers}명\n` +
                             `**주식을 보유한 사용자 수:** ${stockHoldingUsers}명\n\n` +
                             `**업타임:** ${uptime}\n` +
                             `**메모리 사용량:** ${rss}MB (RSS), ${heapUsed}MB (Heap Used)\n` +
                             `**Node.js 버전:** ${nodeVersion}\n` +
                             `**Discord.js 버전:** v${discordJsVersion}\n` +
                             `**데이터베이스 상태:** ${dbStatus}\n` +
                             `**Discord API Ping:** ${ping}ms\n` +
                             `**총 명령어 실행 횟수:** ${totalCommandsExecuted}회\n` +
                             `**운영체제:** ${osType} ${osRelease} (${osPlatform} ${osArch})\n` +
                             `**프로세스 ID (PID):** ${pid}`,
                    ephemeral: true
                });

            } else if (subcommand === '주식가격설정') {
                const stockIdentifier = interaction.options.getString('stock');
                const newPriceString = interaction.options.getString('price'); // Get as string
                let newPrice;

                try {
                    newPrice = parseDecimal(newPriceString, '새로운 주식 가격');
                } catch (error) {
                    return interaction.reply({ content: error.message, ephemeral: true });
                }

                if (newPrice.lessThanOrEqualTo(0)) {
                    return interaction.reply({ content: '주식 가격은 0보다 커야 합니다.', ephemeral: true });
                }

                const [stockRows] = await connection.query('SELECT id, name FROM stocks WHERE name = ? OR symbol = ?', [stockIdentifier, stockIdentifier]);
                if (stockRows.length === 0) {
                    return interaction.reply({ content: '해당 주식을 찾을 수 없습니다.', ephemeral: true });
                }
                const stock = stockRows[0];

                await connection.query('UPDATE stocks SET price = ? WHERE id = ?', [newPrice.toFixed(2), stock.id]);
                await interaction.reply({ content: `${stock.name}의 가격을 ${formatDecimal(newPrice)}원으로 설정했습니다.`, ephemeral: true });

            } else if (subcommand === '주식가격초기화') {
                const defaultPriceString = interaction.options.getString('기본값'); // Get as string
                let defaultPrice;

                try {
                    defaultPrice = parseDecimal(defaultPriceString, '기본 가격');
                } catch (error) {
                    return interaction.reply({ content: error.message, ephemeral: true });
                }

                if (defaultPrice.lessThanOrEqualTo(0)) {
                    return interaction.reply({ content: '주식 가격은 0보다 커야 합니다.', ephemeral: true });
                }

                await connection.query('UPDATE stocks SET price = ?', [defaultPrice.toFixed(2)]);
                await interaction.reply({ content: `모든 주식의 가격을 ${formatDecimal(defaultPrice)}원으로 초기화했습니다.`, ephemeral: true });

            } else if (subcommand === '유저잔액설정') {
                const targetUser = interaction.options.getUser('user');
                const operation = interaction.options.getString('operation');
                const amountString = interaction.options.getString('amount'); // Get as string
                let amount;

                try {
                    amount = parseDecimal(amountString, '금액');
                } catch (error) {
                    return interaction.reply({ content: error.message, ephemeral: true });
                }

                if (amount.lessThan(0)) {
                    return interaction.reply({ content: '금액은 0 이상이어야 합니다.', ephemeral: true });
                }

                let currentBalance = new Decimal(0);
                const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [targetUser.id]);
                if (userRows.length > 0) {
                    currentBalance = new Decimal(userRows[0].balance);
                }

                let newBalance;
                let replyMessage;

                switch (operation) {
                    case 'set':
                        newBalance = amount;
                        replyMessage = `${targetUser.username}님의 잔액을 ${formatDecimal(newBalance)}원으로 설정했습니다.`;
                        break;
                    case 'add':
                        newBalance = currentBalance.plus(amount);
                        replyMessage = `${targetUser.username}님의 잔액에 ${formatDecimal(amount)}원을 추가하여 ${formatDecimal(newBalance)}원이 되었습니다.`;
                        break;
                    case 'subtract':
                        newBalance = currentBalance.minus(amount);
                        if (newBalance.lessThan(0)) {
                            newBalance = new Decimal(0); // 잔액이 음수가 되지 않도록 최소 0으로 설정
                            replyMessage = `${targetUser.username}님의 잔액에서 ${formatDecimal(amount)}원을 차감하려 했으나 잔액이 부족하여 0원으로 설정되었습니다.`;
                        } else {
                            replyMessage = `${targetUser.username}님의 잔액에서 ${formatDecimal(amount)}원을 차감하여 ${formatDecimal(newBalance)}원이 되었습니다.`;
                        }
                        break;
                    default:
                        return interaction.reply({ content: '유효하지 않은 작업입니다.', ephemeral: true });
                }

                // users 테이블에 유저가 없으면 추가 (가입 명령어와 유사)
                await connection.query('INSERT INTO users (id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = ?', [targetUser.id, newBalance.toFixed(2), newBalance.toFixed(2)]);
                await interaction.reply({ content: replyMessage, ephemeral: true });

            } else if (subcommand === '국가주식거래') {
                const tradeType = interaction.options.getString('거래');
                const stockIdentifier = interaction.options.getString('stock');
                const quantityString = interaction.options.getString('수량'); // Get as string
                let quantity;

                try {
                    quantity = parseDecimal(quantityString, '수량');
                } catch (error) {
                    return interaction.reply({ content: error.message, ephemeral: true });
                }

                if (quantity.lessThanOrEqualTo(0)) {
                    return interaction.reply({ content: '수량은 1 이상이어야 합니다.', ephemeral: true });
                }

                await connection.beginTransaction();

                try {
                    const [stockRows] = await connection.query('SELECT id, name, price FROM stocks WHERE name = ? OR symbol = ?', [stockIdentifier, stockIdentifier]);
                    if (stockRows.length === 0) {
                        await connection.rollback();
                        return interaction.reply({ content: '해당 주식을 찾을 수 없습니다.', ephemeral: true });
                    }
                    const stock = stockRows[0];
                    const stockPrice = new Decimal(stock.price);

                    if (tradeType === 'buy') {
                        const totalPrice = stockPrice.times(quantity);
                        const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
                        const guildBalance = new Decimal(guildBankRows[0].balance);

                        if (guildBalance.lessThan(totalPrice)) {
                            await connection.rollback();
                            return interaction.reply({ content: `국가 은행 잔고가 부족합니다. 매수하려면 ${formatDecimal(totalPrice)}원이 필요합니다.`, ephemeral: true });
                        }

                        await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [totalPrice.toFixed(2)]);

                        const [guildStockRows] = await connection.query('SELECT quantity, average_purchase_price FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stock.id]);
                        if (guildStockRows.length > 0) {
                            const existingStock = guildStockRows[0];
                            const existingQuantity = new Decimal(existingStock.quantity);
                            const existingAveragePrice = new Decimal(existingStock.average_purchase_price);

                            const newQuantity = existingQuantity.plus(quantity);
                            const newAveragePrice = (existingQuantity.times(existingAveragePrice).plus(totalPrice)).dividedBy(newQuantity);
                            await connection.query('UPDATE guild_stocks SET quantity = ?, average_purchase_price = ? WHERE guild_id = 1 AND stock_id = ?', [newQuantity.toFixed(0), newAveragePrice.toFixed(2), stock.id]);
                        } else {
                            await connection.query('INSERT INTO guild_stocks (guild_id, stock_id, quantity, average_purchase_price) VALUES (?, ?, ?, ?)', [1, stock.id, quantity.toFixed(0), stockPrice.toFixed(2)]);
                        }
                        await connection.commit();
                        await interaction.reply({ content: `국가 은행이 ${stock.name} ${formatDecimal(quantity)}주를 ${formatDecimal(totalPrice)}원에 매수했습니다.`, ephemeral: true });
                        await sendGuildBankStatus(interaction.client, '관리자 국가 주식 매수');

                    } else if (tradeType === 'sell') {
                        const [guildStockRows] = await connection.query('SELECT quantity FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stock.id]);
                        if (guildStockRows.length === 0 || new Decimal(guildStockRows[0].quantity).lessThan(quantity)) {
                            await connection.rollback();
                            return interaction.reply({ content: `국가 은행이 보유한 ${stock.name} 주식이 부족합니다.`, ephemeral: true });
                        }

                        const totalPrice = stockPrice.times(quantity);
                        const newQuantity = new Decimal(guildStockRows[0].quantity).minus(quantity);

                        if (newQuantity.isZero()) {
                            await connection.query('DELETE FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stock.id]);
                        } else {
                            await connection.query('UPDATE guild_stocks SET quantity = ? WHERE guild_id = 1 AND stock_id = ?', [newQuantity.toFixed(0), stock.id]);
                        }

                        await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [totalPrice.toFixed(2)]);
                        await connection.commit();
                        await interaction.reply({ content: `국가 은행이 ${stock.name} ${formatDecimal(quantity)}주를 ${formatDecimal(totalPrice)}원에 매도했습니다.`, ephemeral: true });
                        await sendGuildBankStatus(interaction.client, '관리자 국가 주식 매도');
                    }
                } catch (tradeError) {
                    await connection.rollback();
                    console.error('국가 주식 거래 중 오류:', tradeError);
                    await interaction.reply({ content: '국가 주식 거래 중 오류가 발생했습니다.', ephemeral: true });
                }
            }

        } catch (error) {
            console.error('관리자 명령어 실행 중 오류 발생:', error);
            await interaction.reply({ content: '관리자 명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'stock') {
            try {
                const [stocks] = await pool.query('SELECT name, symbol FROM stocks WHERE name LIKE ? OR symbol LIKE ?', [`%${focusedOption.value}%`, `%${focusedOption.value}%`]);
                const choices = stocks.map(stock => ({ name: `${stock.name} (${stock.symbol})`, value: stock.symbol }));
                await interaction.respond(choices.slice(0, 25));
            } catch (error) {
                console.error('Error fetching stocks for autocomplete:', error);
            }
        }
    }
};