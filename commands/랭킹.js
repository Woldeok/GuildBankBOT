const { SlashCommandBuilder } = require('discord.js');
const pool = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랭킹')
        .setDescription('총 자산(보유 금액 + 주식 평가액) 기준으로 사용자 랭킹을 보여줍니다.'),
    async execute(interaction) {
        await interaction.deferReply();

        let connection;
        try {
            connection = await pool.getConnection();

            // 1. 모든 사용자 정보 가져오기
            const [users] = await connection.query('SELECT id, username, balance FROM users');

            if (users.length === 0) {
                return interaction.editReply('아직 봇을 사용하는 유저가 없습니다.');
            }

            const userAssets = [];

            for (const user of users) {
                let totalStockValue = 0;

                // 2. 각 사용자의 주식 보유 현황 및 현재 가치 계산
                const [userStocks] = await connection.query(
                    'SELECT us.quantity, s.price AS current_price FROM user_stocks us JOIN stocks s ON us.stock_id = s.id WHERE us.user_id = ?',
                    [user.id]
                );

                userStocks.forEach(stock => {
                    totalStockValue += stock.quantity * stock.current_price;
                });

                // 3. 총 자산 계산
                const totalAssets = user.balance + totalStockValue;
                userAssets.push({ userId: user.id, username: user.username, totalAssets: totalAssets });
            }

            // 4. 총 자산 기준으로 내림차순 정렬
            userAssets.sort((a, b) => b.totalAssets - a.totalAssets);

            // 5. 랭킹 메시지 생성
            let rankingMessage = '**💰 사용자 자산 랭킹 💰**\n\n';
            if (userAssets.length > 0) {
                userAssets.slice(0, 10).forEach((user, index) => { // 상위 10명만 표시
                    rankingMessage += `${index + 1}. ${user.username}: ${formatDecimal(user.totalAssets)}원\n`;
                });
            } else {
                rankingMessage += '랭킹을 표시할 데이터가 없습니다.';
            }

            await interaction.editReply(rankingMessage);

        } catch (error) {
            console.error('랭킹 조회 중 오류 발생:', error);
            await interaction.editReply('랭킹을 불러오는 중 오류가 발생했습니다.');
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}