const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { sendGuildBankStatus } = require('../tasks/sendGuildBankStatus');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('출금')
        .setDescription('국가 은행에서 돈을 출금합니다. (관리자 전용)')
        .addStringOption(option => // Changed to StringOption
            option.setName('금액')
                .setDescription('출금할 금액')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('유저')
                .setDescription('돈을 받을 유저 (선택 사항, 미지정 시 본인에게 지급)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 관리자 권한 필요
    async execute(interaction) {
        // 관리자 권한 확인
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        const callerId = interaction.user.id; // 명령어를 실행한 유저 ID
        const amountString = interaction.options.getString('금액'); // Get as string
        let amount;

        try {
            amount = parseDecimal(amountString, '출금 금액');
        } catch (error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }

        const targetUser = interaction.options.getUser('유저') || interaction.user; // 돈을 받을 유저, 기본값은 명령어 실행 유저
        const targetUserId = targetUser.id;

        if (amount.lessThanOrEqualTo(0)) {
            return interaction.reply({ content: '출금할 금액은 0보다 커야 합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 국가 은행 잔고 확인
            const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
            if (guildBankRows.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '국가 은행이 초기화되지 않았습니다. 관리자에게 문의하세요.', ephemeral: true });
            }

            const guildBalance = new Decimal(guildBankRows[0].balance); // Convert to Decimal
            if (guildBalance.lessThan(amount)) {
                await connection.rollback();
                return interaction.reply({ content: `국가 은행 잔고가 부족합니다. 현재 잔고: ${formatDecimal(guildBalance)}원`, ephemeral: true });
            }

            // 2. 국가 은행 잔고 차감
            await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [amount.toFixed(2)]); // Use toFixed(2) for DB

            // 3. 대상 유저 잔고 증가 (없으면 생성)
            await connection.query(
                'INSERT INTO users (id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
                [targetUserId, amount.toFixed(2), amount.toFixed(2)] // Use toFixed(2) for DB
            );

            // 4. 거래 기록 추가
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [callerId, amount.toFixed(2), 'withdrawal']); // Use toFixed(2) for DB

            await connection.commit();
            await interaction.reply(`✅ ${formatDecimal(amount)}원이 국가 은행에서 ${targetUser.username}님에게 출금되었습니다. 현재 국가 은행 잔고: ${formatDecimal(guildBalance.minus(amount))}원`);
            await sendGuildBankStatus(interaction.client, '관리자 국가 자금 인출');

        } catch (error) {
            console.error('출금 처리 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '출금 처리 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};
