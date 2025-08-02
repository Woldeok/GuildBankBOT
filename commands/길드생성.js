const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('길드생성')
        .setDescription('새로운 길드를 생성합니다.')
        .addStringOption(option =>
            option.setName('길드이름')
                .setDescription('생성할 길드의 이름')
                .setRequired(true)),
    async execute(interaction) {
        const guildName = interaction.options.getString('길드이름');
        const userId = interaction.user.id;
        const username = interaction.user.username; // Discord username

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 유저가 이미 길드에 속해 있는지 확인
            const [existingMember] = await connection.query('SELECT guild_id FROM guild_members WHERE user_id = ?', [userId]);
            if (existingMember.length > 0) {
                await connection.rollback();
                return interaction.reply({ content: '이미 길드에 속해 있습니다. 새로운 길드를 생성할 수 없습니다.', ephemeral: true });
            }

            // 2. 길드 이름 중복 확인
            const [existingGuild] = await connection.query('SELECT id FROM guilds WHERE name = ?', [guildName]);
            if (existingGuild.length > 0) {
                await connection.rollback();
                return interaction.reply({ content: '이미 존재하는 길드 이름입니다. 다른 이름을 선택해주세요.', ephemeral: true });
            }

            // 3. 새로운 길드 생성
            const [guildResult] = await connection.query('INSERT INTO guilds (name) VALUES (?)', [guildName]);
            const newGuildId = guildResult.insertId;

            // 4. 길드 생성자를 길드 멤버로 추가
            await connection.query('INSERT INTO guild_members (user_id, guild_id) VALUES (?, ?)', [userId, newGuildId]);

            await connection.commit();
            await interaction.reply(`✅ 길드 '${guildName}'이(가) 성공적으로 생성되었습니다! 당신은 이제 이 길드의 멤버입니다.`);

        } catch (error) {
            console.error('길드 생성 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '길드 생성 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};