const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('이자지급')
        .setDescription('모든 유저에게 이자를 지급합니다. (관리자 전용)')
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

            // 모든 유저의 잔고와 이자율을 가져옵니다.
            const [users] = await connection.query('SELECT id, balance, interest_rate FROM users');

            let totalInterestPaid = new Decimal(0);
            for (const user of users) {
                const userBalance = new Decimal(user.balance);
                const interestRate = new Decimal(user.interest_rate);
                const interest = userBalance.times(interestRate).floor();
                if (interest.greaterThan(0)) {
                    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [interest.toFixed(2), user.id]);
                    totalInterestPaid = totalInterestPaid.plus(interest);
                }
            }

            // 국가 은행 잔고에서 이자 지급액 차감 (선택 사항: 국가 은행에서 이자를 지급하는 경우)
            // 현재는 유저 잔고만 증가시키고 국가 은행 잔고는 건드리지 않습니다.
            // 만약 국가 은행에서 이자를 지급하는 방식으로 변경하려면 아래 주석을 해제하고 guild_bank 테이블 업데이트 로직을 추가하세요.
            /*
            await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [totalInterestPaid.toFixed(2)]);
            */

            await connection.commit();
            await interaction.reply(`✅ 모든 유저에게 총 ${formatDecimal(totalInterestPaid)}원의 이자가 지급되었습니다.`);

        } catch (error) {
            console.error('이자 지급 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '이자 지급 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};