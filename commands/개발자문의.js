const { SlashCommandBuilder } = require('@discordjs/builders');
require('dotenv').config();

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('개발자문의')
        .setDescription('개발자(관리자)에게 문의사항이나 오류를 제보합니다.')
        .addStringOption(option =>
            option.setName('내용')
                .setDescription('문의할 내용 또는 오류 제보')
                .setRequired(true)),
    async execute(interaction) {
        const inquiryContent = interaction.options.getString('내용');
        const user = interaction.user;

        if (ADMIN_IDS.length === 0) {
            return interaction.reply({ content: '현재 문의를 받을 수 있는 관리자가 설정되어 있지 않습니다.', ephemeral: true });
        }

        let successCount = 0;
        for (const adminId of ADMIN_IDS) {
            try {
                const adminUser = await interaction.client.users.fetch(adminId);
                // JavaScript 템플릿 리터럴 내의 백틱은 이스케이프 필요 없음 (Discord Markdown)
const dmMessage = `🔔 **개발자 문의 알림**
보낸 유저: ${user.username} (${user.id})
문의 내용:
\`\`\`
${inquiryContent}
\`\`\``;
                await adminUser.send(dmMessage);
                successCount++;
            } catch (error) {
                console.error(`관리자 ${adminId}에게 문의 DM 전송 실패:`, error);
            }
        }

        if (successCount > 0) {
            await interaction.reply({ content: '문의 내용이 개발자(관리자)에게 성공적으로 전송되었습니다. 감사합니다!', ephemeral: true });
        } else {
            await interaction.reply({ content: '문의 내용 전송에 실패했습니다. 관리자에게 문의해주세요.', ephemeral: true });
        }
    },
};