const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('거래기록')
        .setDescription('길드 은행의 최근 거래 기록을 확인합니다.'),
    async execute(interaction) {
        let connection;
        try {
            connection = await pool.getConnection();

            const [transactions] = await connection.query(
                'SELECT user_id, amount, type, timestamp FROM guild_transactions ORDER BY timestamp DESC LIMIT 10'
            );

            if (transactions.length === 0) {
                return interaction.reply({ content: '아직 길드 은행 거래 기록이 없습니다.', ephemeral: true });
            }

            let replyContent = `**국가 은행 최근 거래 기록 (최신순):**
`;
            for (const tx of transactions) {
                const user = await interaction.client.users.fetch(tx.user_id);
                const username = user ? user.username : `알 수 없는 유저 (${tx.user_id})`;
                const amount = new Decimal(tx.amount);
                let typeText;
                let sign;

                switch (tx.type) {
                    case 'deposit':
                        typeText = '입금';
                        sign = '+';
                        break;
                    case 'withdrawal':
                        typeText = '출금';
                        sign = '-';
                        break;
                    case 'loan':
                        typeText = '대출';
                        sign = '+';
                        break;
                    case 'repayment':
                        typeText = '상환';
                        sign = '-'; // 상환은 유저가 은행에 돈을 주는 것이므로 유저 입장에서 마이너스
                        break;
                    case 'loan_collection':
                        typeText = '대출회수';
                        sign = '+';
                        break;
                    case 'guild_buy':
                        typeText = '주식매수';
                        sign = '-';
                        break;
                    case 'tax_collection':
                        typeText = '세금징수';
                        sign = '+';
                        break;
                    default:
                        typeText = tx.type;
                        sign = '';
                }

                replyContent += `${tx.timestamp.toLocaleString()} | ${username}님이 ${typeText} ${sign}${formatDecimal(amount)}원
`;
            }

            await interaction.reply({ content: replyContent, ephemeral: true });

        } catch (error) {
            console.error('거래 기록 조회 중 오류 발생:', error);
            await interaction.reply({ content: '거래 기록 조회 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};