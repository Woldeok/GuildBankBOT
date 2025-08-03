const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../database');
require('dotenv').config();
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('은행현황')
        .setDescription('국가 은행의 상세 현황을 확인합니다.')
        .addBooleanOption(option =>
            option.setName('dm')
                .setDescription('결과를 DM으로 받을지 여부 (관리자 전용)')
                .setRequired(false)),
    async execute(interaction) {
        const sendToDM = interaction.options.getBoolean('dm') || false;

        if (sendToDM && !ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: 'DM으로 결과를 받는 것은 관리자만 가능합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();

            // 1. 국가 은행 잔고
            const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
            const guildBalance = guildBankRows.length > 0 ? new Decimal(guildBankRows[0].balance) : new Decimal(0);

            // 2. 보유 주식 현황 및 평가액
            const [ownedStocks] = await connection.query(
                `SELECT s.name, s.symbol, gs.quantity, gs.average_purchase_price, s.price as current_price
                 FROM guild_stocks gs
                 JOIN stocks s ON gs.stock_id = s.id
                 WHERE gs.guild_id = 1 AND gs.quantity > 0
                 ORDER BY (gs.quantity * CAST(s.price AS DECIMAL(20, 4))) DESC`
            );

            let stockReport = '**보유 주식 현황:**\n';
            let totalStockValue = new Decimal(0);
            if (ownedStocks.length > 0) {
                ownedStocks.forEach(stock => {
                    const quantity = new Decimal(stock.quantity);
                    const currentPrice = new Decimal(stock.current_price);
                    const averagePurchasePrice = new Decimal(stock.average_purchase_price);

                    const currentValue = quantity.times(currentPrice);
                    const profit = currentPrice.minus(averagePurchasePrice).times(quantity);
                    const profitRate = currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice).times(100);
                    const sign = profit.greaterThanOrEqualTo(0) ? '+' : '';
                    const color = profit.greaterThanOrEqualTo(0) ? '🟢' : '🔴';

                    stockReport += `${color} ${stock.name}(${stock.symbol}): ${formatDecimal(quantity)}주 | 평가액: ${formatDecimal(currentValue)}원 | 평단가: ${formatDecimal(averagePurchasePrice)}원 | 수익: ${sign}${formatDecimal(profit)}원 (${profitRate.toFixed(2)}%)\n`;
                    totalStockValue = totalStockValue.plus(currentValue);
                });
            } else {
                stockReport += '보유한 주식이 없습니다.\n';
            }

            // 3. 총 자산
            const totalAssets = guildBalance.plus(totalStockValue);

            // 4. 전체 유저 수 및 총 유저 잔액
            const [userStats] = await connection.query('SELECT COUNT(id) as userCount, SUM(balance) as totalUserBalance FROM users');
            const totalUsers = userStats[0].userCount;
            const totalUserBalance = new Decimal(userStats[0].totalUserBalance || 0);

            // 5. 총 대출액
            const [loanStats] = await connection.query("SELECT SUM(amount) as totalLoanAmount FROM loans WHERE status = 'active'");
            const totalLoanAmount = new Decimal(loanStats[0].totalLoanAmount || 0);

            // 최종 메시지 생성
            const finalMessage = `**🏦 국가 은행 상세 현황**\n\n` +
                               `**총 자산:** ${formatDecimal(totalAssets)}원\n` +
                               `> 💰 현금: ${formatDecimal(guildBalance)}원\n` +
                               `> 📈 주식 평가액: ${formatDecimal(totalStockValue)}원\n\n` +
                               `${stockReport}\n` +
                               `**기타 정보:**\n` +
                               `> 👥 총 가입 유저: ${totalUsers}명\n` +
                               `> 💵 유저 총 잔액: ${formatDecimal(totalUserBalance)}원\n` +
                               `> 💸 총 대출액: ${formatDecimal(totalLoanAmount)}원\n`;

            if (sendToDM) {
                try {
                    const user = await interaction.client.users.fetch(interaction.user.id);
                    const messageChunks = finalMessage.match(/[\s\S]{1,1990}/g) || [];
                    for (const chunk of messageChunks) {
                        await user.send(chunk);
                    }
                    await interaction.reply({ content: '은행 현황을 DM으로 전송했습니다.', ephemeral: true });
                } catch (error) {
                    console.error('DM 전송 실패:', error);
                    await interaction.reply({ content: 'DM 전송에 실패했습니다. 봇의 DM을 허용했는지 확인해주세요.', ephemeral: true });
                }
            } else {
                await interaction.reply({ content: finalMessage, ephemeral: true });
            }

        } catch (error) {
            console.error('은행 현황 조회 중 오류 발생:', error);
            await interaction.reply({ content: '은행 현황 조회 중 오류가 발생했습니다.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};
