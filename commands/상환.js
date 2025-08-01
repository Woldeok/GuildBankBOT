const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { sendGuildBankStatus } = require('../tasks/sendGuildBankStatus');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('상환')
        .setDescription('대출금을 상환합니다.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 상환할 대출 정보 가져오기
            const [loans] = await connection.query('SELECT id, amount, interest_rate FROM loans WHERE user_id = ? AND status = \'active\'', [userId]);
            if (loans.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '상환할 대출이 없습니다.', ephemeral: true });
            }
            const loan = loans[0];
            const loanAmount = new Decimal(loan.amount);
            const interestRate = new Decimal(loan.interest_rate);
            const interest = loanAmount.times(interestRate).floor(); // 이자 계산
            const totalAmount = loanAmount.plus(interest);

            // 2. 유저 잔고 확인
            const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
            const userBalance = new Decimal(userRows[0].balance);
            if (userRows.length === 0 || userBalance.lessThan(totalAmount)) {
                await connection.rollback();
                return interaction.reply({ content: `상환 금액(원금+이자: ${formatDecimal(totalAmount)}원)이 부족합니다. 현재 잔고: ${formatDecimal(userBalance)}원`, ephemeral: true });
            }

            // 3. 유저 잔고에서 상환금 차감
            await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalAmount.toFixed(2), userId]);

            // 4. 국가 은행 잔고에 상환금 입금
            await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [totalAmount.toFixed(2)]);

            // 5. 대출 상태 변경
            await connection.query('UPDATE loans SET status = \'paid\' WHERE id = ?', [loan.id]);
            
            // 6. 거래 기록 추가
            await connection.query('INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)', [userId, totalAmount.toFixed(2), 'repayment']);


            await connection.commit();
            await interaction.reply(`✅ 대출금 ${formatDecimal(totalAmount)}원(원금: ${formatDecimal(loanAmount)}, 이자: ${formatDecimal(interest)})을 성공적으로 상환했습니다.`);
            await sendGuildBankStatus(interaction.client, '대출 상환으로 인한 국가 은행 변동');

        } catch (error) {
            console.error('상환 처리 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '상환 처리 중 오류가 발생했습니다.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};