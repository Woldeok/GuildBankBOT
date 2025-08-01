const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('대출회수')
        .setDescription('특정 유저의 연체된 대출을 강제로 회수합니다. (관리자 전용)')
        .addUserOption(option =>
            option.setName('유저')
                .setDescription('대출을 회수할 유저')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // 관리자 권한 확인
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('유저');
        const targetUserId = targetUser.id;

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 대상 유저의 활성 대출 정보 가져오기
            const [loans] = await connection.query('SELECT id, amount, interest_rate FROM loans WHERE user_id = ? AND status = \'active\'', [targetUserId]);
            if (loans.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: `${targetUser.username}님에게 활성 상태의 대출이 없습니다.`, ephemeral: true });
            }
            const loan = loans[0];
            const loanAmount = new Decimal(loan.amount);
            const interestRate = new Decimal(loan.interest_rate);
            const interest = loanAmount.times(interestRate).floor(); // 이자 계산
            const totalAmountToCollect = loanAmount.plus(interest);

            // 2. 유저 잔고에서 상환금 차감 (잔고가 마이너스가 되더라도 차감)
            await connection.query(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [totalAmountToCollect.toFixed(2), targetUserId]
            );

            // 3. 국가 은행 잔고에 상환금 입금
            await connection.query(
                'UPDATE guild_bank SET balance = balance + ? WHERE id = 1',
                [totalAmountToCollect.toFixed(2)]
            );

            // 4. 대출 상태를 \'paid\'로 업데이트
            await connection.query(
                'UPDATE loans SET status = \'paid\' WHERE id = ?',
                [loan.id]
            );

            // 5. 거래 기록 추가
            await connection.query(
                'INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)',
                [targetUserId, totalAmountToCollect.toFixed(2), 'loan_collection']
            );

            await connection.commit();
            await interaction.reply(`✅ ${targetUser.username}님의 대출금 ${formatDecimal(totalAmountToCollect)}원(원금: ${formatDecimal(loanAmount)}, 이자: ${formatDecimal(interest)})이 성공적으로 회수되었습니다.`);

        } catch (error) {
            console.error('대출 회수 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '대출 회수 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};