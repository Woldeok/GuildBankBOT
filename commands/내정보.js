const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('내정보')
    .setDescription('보유 자산, 주식 등 내 정보를 확인합니다.'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true }); // 즉시 응답을 지연시킴

      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [interaction.user.id]);
      if (rows.length === 0) {
        return interaction.editReply({ content: '가입 먼저 진행해주세요. `/가입`' }); // editReply로 변경
      }

      const user = rows[0];
      const userBalance = new Decimal(user.balance);

      // Fetch user's stocks
      const [userStocks] = await pool.query(
        'SELECT us.quantity, us.average_purchase_price, s.name, s.symbol, s.price AS current_price FROM user_stocks us JOIN stocks s ON us.stock_id = s.id WHERE us.user_id = ?',
        [interaction.user.id]
      );

      let stockFields = [];
      let totalStockValue = new Decimal(0);
      let totalProfitLoss = new Decimal(0);

      if (userStocks.length > 0) {
        userStocks.forEach(stock => {
          const quantity = new Decimal(stock.quantity);
          const currentPrice = new Decimal(stock.current_price);
          const averagePurchasePrice = new Decimal(stock.average_purchase_price);

          const currentValue = quantity.times(currentPrice);
          const purchaseValue = quantity.times(averagePurchasePrice);
          const profitLoss = currentValue.minus(purchaseValue);
          const profitLossPercentage = profitLoss.dividedBy(purchaseValue).times(100);

          totalStockValue = totalStockValue.plus(currentValue);
          totalProfitLoss = totalProfitLoss.plus(profitLoss);

          stockFields.push(
            `**${stock.name} (${stock.symbol})**\n` +
            `수량: ${formatDecimal(quantity)}주\n` +
            `평단: ${formatDecimal(averagePurchasePrice)}원\n` +
            `현재가: ${formatDecimal(currentPrice)}원\n` +
            `평가손익: ${formatDecimal(profitLoss)}원 (${profitLossPercentage.toFixed(2)}%)`
          );
        });
      } else {
        stockFields.push('보유한 주식이 없습니다.');
      }

      const embed = {
        color: 0x0099ff,
        title: `${user.username}님의 정보`,
        fields: [
          { name: '💰 보유 금액', value: `${formatDecimal(userBalance)}원`, inline: true },
          { name: '📅 가입일', value: new Date(user.join_date).toLocaleDateString(), inline: true },
          { name: '📈 보유 주식', value: stockFields.join('\n\n') },
        ],
        timestamp: new Date(),
      };

      if (userStocks.length > 0) {
        embed.fields.push(
          { name: '총 주식 평가액', value: `${formatDecimal(totalStockValue)}원`, inline: true },
          { name: '총 평가 손익', value: `${formatDecimal(totalProfitLoss)}원`, inline: true }
        );
      }

      await interaction.editReply({ embeds: [embed] }); // editReply로 변경
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '정보를 불러오는 중 오류가 발생했습니다.' }); // editReply로 변경
    }
  },
};
