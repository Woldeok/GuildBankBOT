const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('은행수익기록')
        .setDescription('현재 국가 은행의 수익성을 기록하고 이전 기록 대비 순이익을 계산합니다. (관리자 전용)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // 관리자 권한 확인
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 현재 국가 은행 잔고 조회
            const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
            if (guildBankRows.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '국가 은행 잔고를 조회할 수 없습니다. 관리자에게 문의하세요.', ephemeral: true });
            }
            const currentBankBalance = new Decimal(guildBankRows[0].balance);

            // 2. 가장 최근의 은행 수익 기록 조회
            const [lastRecordRows] = await connection.query(
                'SELECT guild_bank_balance_snapshot FROM bank_profit_records ORDER BY recorded_at DESC LIMIT 1'
            );

            let netProfit = null;
            let replyMessage = '';

            // 3. 총 주식 거래 수익/손실 조회
            const [stockProfitLossRows] = await connection.query(
                `SELECT SUM(amount) as total_stock_profit_loss FROM guild_transactions WHERE type IN ('stock_trading_profit', 'stock_trading_loss')`
            );
            const totalStockProfitLoss = stockProfitLossRows[0].total_stock_profit_loss ? new Decimal(stockProfitLossRows[0].total_stock_profit_loss) : new Decimal(0);

            if (lastRecordRows.length > 0) {
                const lastRecordedBalance = new Decimal(lastRecordRows[0].guild_bank_balance_snapshot);
                netProfit = currentBankBalance.minus(lastRecordedBalance);
                replyMessage = `✅ 은행 수익성이 기록되었습니다.\n` +
                               `현재 은행 잔고: ${formatDecimal(currentBankBalance)}원\n` +
                               `이전 기록 대비 순이익: ${netProfit.isPositive() ? '+' : ''}${formatDecimal(netProfit)}원\n` +
                               `총 주식 거래 수익/손실: ${totalStockProfitLoss.isPositive() ? '+' : ''}${formatDecimal(totalStockProfitLoss)}원`;
            } else {
                replyMessage = `✅ 은행 수익성이 기록되었습니다.\n` +
                               `현재 은행 잔고: ${formatDecimal(currentBankBalance)}원\n` +
                               `이전 기록이 없어 순이익을 계산할 수 없습니다.\n` +
                               `총 주식 거래 수익/손실: ${totalStockProfitLoss.isPositive() ? '+' : ''}${formatDecimal(totalStockProfitLoss)}원`;
            }

            // 3. 새로운 수익 기록 삽입
            await connection.query(
                'INSERT INTO bank_profit_records (guild_bank_balance_snapshot, net_profit_since_last_record) VALUES (?, ?)',
                [currentBankBalance.toFixed(2), netProfit ? netProfit.toFixed(2) : null]
            );

            await connection.commit();
            await interaction.reply({ content: replyMessage, ephemeral: false });

        } catch (error) {
            console.error('은행 수익 기록 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '은행 수익 기록 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};