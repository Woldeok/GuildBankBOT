const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../database');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('시즌시작')
        .setDescription('새로운 길드 시즌을 시작합니다. (관리자 전용)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('시즌이름')
                .setDescription('새 시즌의 이름')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('시작일')
                .setDescription('시즌 시작일 (YYYY-MM-DD)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('종료일')
                .setDescription('시즌 종료일 (YYYY-MM-DD)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('랭킹기준')
                .setDescription('시즌 랭킹 기준')
                .setRequired(true)
                .addChoices(
                    { name: '수익률', value: '수익률' },
                    { name: '총거래량', value: '총거래량' },
                    { name: '참여도', value: '참여도' },
                )),
    async execute(interaction) {
        if (!ADMIN_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '이 명령어는 관리자만 사용할 수 있습니다.', ephemeral: true });
        }

        const seasonName = interaction.options.getString('시즌이름');
        const startDateStr = interaction.options.getString('시작일');
        const endDateStr = interaction.options.getString('종료일');
        const rankingCriteria = interaction.options.getString('랭킹기준');

        // 날짜 유효성 검사
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return interaction.reply({ content: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 입력해주세요.', ephemeral: true });
        }
        if (startDate >= endDate) {
            return interaction.reply({ content: '시작일은 종료일보다 빨라야 합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 기존 활성 시즌 비활성화
            await connection.query('UPDATE guild_seasons SET is_active = FALSE WHERE is_active = TRUE');

            // 새 시즌 등록
            const [result] = await connection.query(
                'INSERT INTO guild_seasons (name, start_date, end_date, ranking_criteria, is_active) VALUES (?, ?, ?, ?, TRUE)',
                [seasonName, startDate, endDate, rankingCriteria]
            );

            await connection.commit();
            await interaction.reply(`✅ 새로운 시즌 '${seasonName}'이 성공적으로 시작되었습니다!\n기간: ${startDateStr} ~ ${endDateStr}\n랭킹 기준: ${rankingCriteria}`);

        } catch (error) {
            console.error('시즌 시작 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '시즌 시작 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};