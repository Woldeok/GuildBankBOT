const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('길드미션')
        .setDescription('현재 길드 미션 진행률을 확인합니다.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        let connection;

        try {
            connection = await pool.getConnection();

            // 1. 유저가 속한 길드 확인
            const [memberRows] = await connection.query('SELECT guild_id FROM guild_members WHERE user_id = ?', [userId]);
            if (memberRows.length === 0) {
                return interaction.reply({ content: '아직 길드에 가입하지 않았습니다. 길드에 가입해주세요.', ephemeral: true });
            }
            const guildId = memberRows[0].guild_id;

            // 2. 현재 활성화된 시즌 확인
            const [seasonRows] = await connection.query('SELECT id, name FROM guild_seasons WHERE is_active = TRUE');
            if (seasonRows.length === 0) {
                return interaction.reply({ content: '현재 진행 중인 시즌이 없습니다.', ephemeral: true });
            }
            const currentSeason = seasonRows[0];

            // 3. 길드의 현재 시즌 미션 조회
            const [missionRows] = await connection.query(
                'SELECT type, target_value, current_value, completed FROM guild_missions WHERE guild_id = ? AND season_id = ?',
                [guildId, currentSeason.id]
            );

            if (missionRows.length === 0) {
                return interaction.reply({ content: `현재 시즌(${currentSeason.name})에 할당된 미션이 없습니다.`, ephemeral: true });
            }

            let replyContent = `**🏆 현재 시즌: ${currentSeason.name} 길드 미션 현황 🏆**\n\n`;
            for (const mission of missionRows) {
                const progress = new Decimal(mission.current_value).dividedBy(new Decimal(mission.target_value)).times(100);
                const status = mission.completed ? '✅ 완료' : '⏳ 진행 중';
                replyContent += `**${mission.type} 미션:** ${status}\n` +
                                `   목표: ${formatDecimal(new Decimal(mission.target_value))} / 현재: ${formatDecimal(new Decimal(mission.current_value))}\n` +
                                `   진행률: ${progress.toFixed(2)}%\n\n`;
            }

            await interaction.reply({ content: replyContent, ephemeral: true });

        } catch (error) {
            console.error('길드 미션 조회 중 오류 발생:', error);
            await interaction.reply({ content: '길드 미션 조회 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};