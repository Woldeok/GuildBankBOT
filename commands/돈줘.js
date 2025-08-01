const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const INITIAL_BALANCE = new Decimal(100000); // 최초 지급액
const REWARD_COOLDOWN = 10 * 60 * 1000; // 10분 (밀리초 단위)
const MIN_REWARD = new Decimal(500);
const MAX_REWARD = new Decimal(5000);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('돈줘')
    .setDescription('초기 자금을 받거나 10분마다 랜덤 보상을 받습니다.'),
  async execute(interaction) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [interaction.user.id]);
      if (rows.length === 0) {
        return interaction.reply({ content: '가입 먼저 진행해주세요. `/가입`', ephemeral: true });
      }

      const user = rows[0];
      const now = new Date();

      // 최초 자금 지급 로직
      if (user.last_reward_claimed_at === null) {
        await pool.query('UPDATE users SET balance = balance + ?, last_reward_claimed_at = ? WHERE id = ?', [INITIAL_BALANCE.toFixed(2), now, interaction.user.id]);
        return interaction.reply({ content: `🎉 축하합니다! 첫 지원금 ${formatDecimal(INITIAL_BALANCE)}원을 받으셨습니다.`, ephemeral: true });
      }

      // 10분 쿨타임 체크 로직
      const lastRewardTime = new Date(user.last_reward_claimed_at);
      const timeDiff = now.getTime() - lastRewardTime.getTime();

      if (timeDiff < REWARD_COOLDOWN) {
        const remainingTime = Math.ceil((REWARD_COOLDOWN - timeDiff) / 1000 / 60);
        return interaction.reply({ content: `아직 보상을 받을 수 없습니다. 약 ${remainingTime}분 후에 다시 시도해주세요.`, ephemeral: true });
      }

      // 랜덤 보상 지급 로직
      const randomAmount = Decimal.floor(Decimal.random().times(MAX_REWARD.minus(MIN_REWARD).plus(1))).plus(MIN_REWARD);
      await pool.query('UPDATE users SET balance = balance + ?, last_reward_claimed_at = ? WHERE id = ?', [randomAmount.toFixed(2), now, interaction.user.id]);

      await interaction.reply({ content: `💸 보상으로 ${formatDecimal(randomAmount)}원을 받으셨습니다!`, ephemeral: true });

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '보상 지급 중 오류가 발생했습니다.', ephemeral: true });
    }
  },
};