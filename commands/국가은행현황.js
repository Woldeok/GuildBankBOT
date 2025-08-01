const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('국가은행현황')
        .setDescription('국가 은행의 현재 잔고를 확인합니다.'),
    async execute(interaction) {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');

            if (rows.length === 0) {
                return interaction.reply({ content: '국가 은행 정보를 찾을 수 없습니다. 관리자에게 문의하세요.', ephemeral: true });
            }

            const nationalBankBalance = new Decimal(rows[0].balance);

            // Calculate recent profit/loss (e.g., last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const [transactions] = await connection.query(
                'SELECT amount, type FROM guild_transactions WHERE timestamp >= ?',
                [sevenDaysAgo]
            );

            let profitLoss = new Decimal(0);
            for (const tx of transactions) {
                const amount = new Decimal(tx.amount);
                if (tx.type === 'deposit' || tx.type === 'tax_collection' || tx.type === 'repayment' || tx.type === 'loan_collection') {
                    profitLoss = profitLoss.plus(amount);
                } else if (tx.type === 'withdrawal' || tx.type === 'loan' || tx.type === 'guild_buy') {
                    profitLoss = profitLoss.minus(amount);
                }
            }

            let profitLossMessage = '';
            if (profitLoss.greaterThan(0)) {
                profitLossMessage = `📈 최근 7일간 수익: ${formatDecimal(profitLoss)}원`;
            } else if (profitLoss.lessThan(0)) {
                profitLossMessage = `📉 최근 7일간 손실: ${formatDecimal(profitLoss.abs())}원`;
            } else {
                profitLossMessage = `📊 최근 7일간 변동 없음`;
            }

            await interaction.reply(`🏦 **국가 은행 현재 잔고:** ${formatDecimal(nationalBankBalance)}원\n${profitLossMessage}`);

        } catch (error) {
            console.error('국가 은행 현황 조회 중 오류 발생:', error);
            await interaction.reply({ content: '국가 은행 현황 조회 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};
