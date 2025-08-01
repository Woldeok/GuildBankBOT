const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('송금')
        .setDescription('다른 유저에게 돈을 송금합니다. (10% 수수료)')
        .addUserOption(option =>
            option.setName('대상유저')
                .setDescription('돈을 송금할 유저')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('금액')
                .setDescription('송금할 금액')
                .setRequired(true)),
    async execute(interaction) {
        const senderId = interaction.user.id;
        const recipientUser = interaction.options.getUser('대상유저');
        const recipientId = recipientUser.id;
        const amountString = interaction.options.getString('금액');
        let amount;

        if (senderId === recipientId) {
            return interaction.reply({ content: '자기 자신에게 송금할 수 없습니다.', ephemeral: true });
        }

        try {
            amount = parseDecimal(amountString, '송금 금액');
        } catch (error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }

        if (amount.lessThanOrEqualTo(0)) {
            return interaction.reply({ content: '송금할 금액은 0보다 커야 합니다.', ephemeral: true });
        }

        const feeRate = new Decimal(0.10); // 10% 수수료
        const fee = amount.times(feeRate).floor(); // 수수료 계산 (소수점 버림)
        const totalAmountToDeduct = amount.plus(fee);

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 보내는 유저의 잔고 확인
            const [senderRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [senderId]);
            if (senderRows.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '가입 먼저 진행해주세요. `/가입`', ephemeral: true });
            }
            const senderBalance = new Decimal(senderRows[0].balance);

            if (senderBalance.lessThan(totalAmountToDeduct)) {
                await connection.rollback();
                return interaction.reply({ content: `잔고가 부족합니다. 송금 금액(${formatDecimal(amount)}원)과 수수료(${formatDecimal(fee)}원)를 포함하여 총 ${formatDecimal(totalAmountToDeduct)}원이 필요합니다. 현재 잔고: ${formatDecimal(senderBalance)}원`, ephemeral: true });
            }

            // 2. 받는 유저의 존재 여부 확인 (없으면 생성)
            const [recipientRows] = await connection.query('SELECT id FROM users WHERE id = ?', [recipientId]);
            if (recipientRows.length === 0) {
                // 받는 유저가 없으면 새로 생성
                await connection.query('INSERT INTO users (id) VALUES (?)', [recipientId]);
            }

            // 3. 보내는 유저 잔고 차감
            await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalAmountToDeduct.toFixed(2), senderId]);

            // 4. 받는 유저 잔고 증가
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount.toFixed(2), recipientId]);

            // 5. 국가 은행 잔고에 수수료 추가
            await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [fee.toFixed(2)]);

            // 6. 거래 기록 추가
            // 송금 내역 (보내는 유저 기준)
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [senderId, amount.times(-1).toFixed(2), 'transfer_sent']);
            // 수수료 내역 (국가 은행 기준)
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [senderId, fee.toFixed(2), 'transfer_fee']);
            // 입금 내역 (받는 유저 기준)
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [recipientId, amount.toFixed(2), 'transfer_received']);

            await connection.commit();
            await interaction.reply(`✅ ${formatDecimal(amount)}원을 ${recipientUser.username}님에게 송금했습니다. (수수료: ${formatDecimal(fee)}원)`);

            // 관리자에게 송금 내역 알림
            const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];
            if (ADMIN_IDS.length > 0) {
                const adminMessage = `🔔 **송금 알림:**\n` +
                                     `보낸 유저: ${interaction.user.username} (${interaction.user.id})\n` +
                                     `받은 유저: ${recipientUser.username} (${recipientUser.id})\n` +
                                     `송금 금액: ${formatDecimal(amount)}원\n` +
                                     `수수료: ${formatDecimal(fee)}원 (국가 금고 환수)\n` +
                                     `총 차감 금액: ${formatDecimal(totalAmountToDeduct)}원`;
                for (const adminId of ADMIN_IDS) {
                    try {
                        const adminUser = await interaction.client.users.fetch(adminId);
                        await adminUser.send(adminMessage);
                    } catch (dmError) {
                        console.error(`관리자 ${adminId}에게 송금 알림 DM 전송 실패:`, dmError);
                    }
                }
            }

        } catch (error) {
            console.error('송금 처리 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '송금 처리 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};