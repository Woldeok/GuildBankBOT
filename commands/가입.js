const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('가입')
    .setDescription('봇 서비스에 가입합니다.'),
  async execute(interaction) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [interaction.user.id]);
      if (rows.length > 0) {
        return interaction.reply({ content: '이미 가입되어 있습니다.', ephemeral: true });
      }

      await pool.query('INSERT INTO users (id) VALUES (?)', [interaction.user.id]);
      await interaction.reply({ content: '가입이 완료되었습니다. `/내정보` 명령어로 정보를 확인하세요.', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '가입 처리 중 오류가 발생했습니다.', ephemeral: true });
    }
  },
};
