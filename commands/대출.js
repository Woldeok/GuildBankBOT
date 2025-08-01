const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('대출')
        .setDescription('국가 은행에서 돈을 대출받습니다.')
        .addStringOption(option => // Changed to StringOption
            option.setName('금액')
                .setDescription('대출받을 금액')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const amountString = interaction.options.getString('금액'); // Get as string
        let amount;

        try {
            amount = parseDecimal(amountString, '대출 금액');
        } catch (error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }

        if (amount.lessThanOrEqualTo(0)) {
            return interaction.reply({ content: '대출 금액은 0보다 커야 합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 이미 대출이 있는지 확인
            const [existingLoans] = await connection.query('SELECT id FROM loans WHERE user_id = ? AND status = \'active\'', [userId]);
            if (existingLoans.length > 0) {
                await connection.rollback();
                return interaction.reply({ content: '이미 활성 상태의 대출이 있습니다. 기존 대출을 먼저 상환해주세요.', ephemeral: true });
            }

            // 2. 국가 은행 잔고 확인
            const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
            const guildBalance = new Decimal(guildBankRows[0].balance);
            if (guildBankRows.length === 0 || guildBalance.lessThan(amount)) {
                await connection.rollback();
                return interaction.reply({ content: '국가 은행의 잔고가 부족하여 대출을 실행할 수 없습니다.', ephemeral: true });
            }

            // 3. 대출 기록 생성 (상환 기간 7일)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            await connection.query(
                'INSERT INTO loans (user_id, amount, due_date) VALUES (?, ?, ?)',
                [userId, amount.toFixed(2), dueDate]
            );

            // 4. 유저 잔고에 대출금 입금
            await connection.query(
                'INSERT INTO users (id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
                [userId, amount.toFixed(2), amount.toFixed(2)]
            );

            // 5. 국가 은행 잔고에서 대출금 차감
            await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [amount.toFixed(2)]);
            
            // 6. 거래 기록 추가
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [userId, amount.toFixed(2), 'loan']);


            await connection.commit();
            await interaction.reply(`✅ ${formatDecimal(amount)}원을 성공적으로 대출받았습니다. 7일 안에 상환해주세요. (이자율 5%)`);

        } catch (error) {
            console.error('대출 처리 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '대출 처리 중 오류가 발생했습니다.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};