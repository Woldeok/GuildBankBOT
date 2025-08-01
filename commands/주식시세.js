const { SlashCommandBuilder } = require('discord.js');
const pool = require('../database');
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('주식시세')
        .setDescription('현재 주식 시세를 보여줍니다.'),
    async execute(interaction) {
        try {
            const [stocks] = await pool.query('SELECT name, symbol, price FROM stocks');
            if (stocks.length === 0) {
                return interaction.reply('현재 상장된 주식이 없습니다.');
            }

            const stockList = stocks.map(stock => {
                const price = new Decimal(stock.price);
                return `${stock.name} (${stock.symbol}): ${formatDecimal(price)}원`;
            }).join('\n');

            await interaction.reply(`**현재 주식 시세**\n${stockList}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '오류가 발생했습니다.', ephemeral: true });
        }
    },
};