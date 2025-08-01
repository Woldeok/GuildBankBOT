const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { sendGuildBankStatus } = require('../tasks/sendGuildBankStatus');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('입금')
        .setDescription('국가 은행에 돈을 입금합니다. (관리자 전용)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => // Changed to StringOption
            option.setName('금액')
                .setDescription('입금할 금액')
                .setRequired(true)),
    async execute(interaction) {
        // 관리자 권한 확인
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const amountString = interaction.options.getString('금액'); // Get as string
        let amount;

        try {
            amount = parseDecimal(amountString, '입금 금액');
        } catch (error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }

        if (amount.lessThanOrEqualTo(0)) {
            return interaction.reply({ content: '입금할 금액은 0보다 커야 합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 유저의 잔고 확인
            const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '등록되지 않은 유저입니다. `/가입` 명령어로 가입해주세요.', ephemeral: true });
            }

            const userBalance = new Decimal(userRows[0].balance); // Convert to Decimal
            if (userBalance.lessThan(amount)) {
                await connection.rollback();
                return interaction.reply({ content: `잔고가 부족합니다. 현재 잔고: ${formatDecimal(userBalance)}원`, ephemeral: true });
            }

            // 2. 유저 잔고 차감
            await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount.toFixed(2), userId]); // Use toFixed(2) for DB

            // 3. 국가 은행 잔고 증가
            await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [amount.toFixed(2)]); // Use toFixed(2) for DB

            // 4. 거래 기록 추가
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [userId, amount.toFixed(2), 'deposit']); // Use toFixed(2) for DB

            await connection.commit();
            await interaction.reply(`✅ ${formatDecimal(amount)}원이 국가 은행에 입금되었습니다. 현재 유저 잔고: ${formatDecimal(userBalance.minus(amount))}원`);
            await sendGuildBankStatus(interaction.client, '관리자 국가 자금 입금');

        } catch (error) {
            console.error('입금 처리 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '입금 처리 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};
