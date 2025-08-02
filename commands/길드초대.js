const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('길드초대')
        .setDescription('다른 유저를 길드에 초대합니다.')
        .addUserOption(option =>
            option.setName('대상유저')
                .setDescription('초대할 유저')
                .setRequired(true)),
    async execute(interaction) {
        const inviterId = interaction.user.id;
        const inviteeUser = interaction.options.getUser('대상유저');
        const inviteeId = inviteeUser.id;

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. 초대하는 유저가 길드에 속해 있는지 확인
            const [inviterGuild] = await connection.query('SELECT guild_id FROM guild_members WHERE user_id = ?', [inviterId]);
            if (inviterGuild.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '길드에 속해 있어야 다른 유저를 초대할 수 있습니다.', ephemeral: true });
            }
            const guildId = inviterGuild[0].guild_id;

            // 2. 초대하는 유저가 길드장인지 확인 (현재는 길드 생성자가 길드장으로 간주)
            // 이 부분은 추후 권한 시스템이 구현되면 변경될 수 있습니다.
            // 현재는 길드 생성자가 길드장이라고 가정하고, 길드 생성 시 guild_members에 추가되므로 별도 확인 로직은 생략합니다.

            // 3. 초대할 대상 유저가 이미 길드에 속해 있는지 확인
            const [inviteeGuild] = await connection.query('SELECT guild_id FROM guild_members WHERE user_id = ?', [inviteeId]);
            if (inviteeGuild.length > 0) {
                await connection.rollback();
                return interaction.reply({ content: `${inviteeUser.username}님은 이미 다른 길드에 속해 있습니다.`, ephemeral: true });
            }

            // 4. 초대할 대상 유저에게 이미 활성 초대장이 있는지 확인
            const [existingInvitation] = await connection.query('SELECT id FROM guild_invitations WHERE invitee_id = ? AND status = \'pending\'', [inviteeId]);
            if (existingInvitation.length > 0) {
                await connection.rollback();
                return interaction.reply({ content: `${inviteeUser.username}님에게 이미 활성 초대장이 있습니다.`, ephemeral: true });
            }

            // 5. 초대 기록 생성
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료
            await connection.query(
                'INSERT INTO guild_invitations (guild_id, inviter_id, invitee_id, expires_at) VALUES (?, ?, ?, ?)',
                [guildId, inviterId, inviteeId, expiresAt]
            );

            await connection.commit();

            // 6. 초대받은 유저에게 DM 전송
            try {
                const guildNameResult = await connection.query('SELECT name FROM guilds WHERE id = ?', [guildId]);
                const guildName = guildNameResult[0][0].name;

                const inviteeDiscordUser = await interaction.client.users.fetch(inviteeId);
                await inviteeDiscordUser.send(`🔔 **길드 초대 알림!**\n` +
                                                `당신은 ${interaction.user.username}님으로부터 길드 '${guildName}'에 초대되었습니다.\n` +
                                                `길드에 가입하려면 \`/길드가입\` 명령어를 사용해주세요.`);
                await interaction.reply({ content: `${inviteeUser.username}님에게 길드 초대장을 보냈습니다.`, ephemeral: true });
            } catch (dmError) {
                console.error(`초대 DM 전송 실패: ${inviteeId}`, dmError);
                await interaction.reply({ content: `${inviteeUser.username}님에게 길드 초대장을 보냈으나 DM 전송에 실패했습니다. (DM을 허용했는지 확인해주세요)`, ephemeral: true });
            }

        } catch (error) {
            console.error('길드 초대 중 오류 발생:', error);
            if (connection) {
                await connection.rollback();
            }
            await interaction.reply({ content: '길드 초대 중 오류가 발생했습니다. 다시 시도해주세요.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};