
const { SlashCommandBuilder } = require('discord.js');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('주식매도')
        .setDescription('주식을 매도합니다.')
        .addStringOption(option =>
            option.setName('stock')
                .setDescription('매도할 주식의 종목명 또는 심볼')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => // Changed to StringOption
            option.setName('수량')
                .setDescription('매도할 주식의 수량')
                .setRequired(true)),
    async execute(interaction) {
        const stockIdentifier = interaction.options.getString('stock');
        const quantityString = interaction.options.getString('수량'); // Get as string
        const userId = interaction.user.id;
        let quantity;

        try {
            quantity = parseDecimal(quantityString, '수량');
        } catch (error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }

        if (quantity.lessThanOrEqualTo(0)) {
            return interaction.reply({ content: '수량은 1 이상이어야 합니다.', ephemeral: true });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Get stock info
            const [stockRows] = await connection.query('SELECT id, name, price FROM stocks WHERE name = ? OR symbol = ?', [stockIdentifier, stockIdentifier]);
            if (stockRows.length === 0) {
                await connection.rollback();
                return interaction.reply({ content: '해당 주식을 찾을 수 없습니다. 정확한 종목명 또는 심볼을 입력해주세요.', ephemeral: true });
            }
            const stock = stockRows[0];
            const stockPrice = new Decimal(stock.price);
            const totalPrice = stockPrice.times(quantity);

            // 2. Get user's stock holding
            const [userStockRows] = await connection.query('SELECT quantity, average_purchase_price FROM user_stocks WHERE user_id = ? AND stock_id = ?', [userId, stock.id]);
            const existingQuantity = userStockRows.length > 0 ? new Decimal(userStockRows[0].quantity) : new Decimal(0);

            if (userStockRows.length === 0 || existingQuantity.lessThan(quantity)) {
                await connection.rollback();
                return interaction.reply({ content: `보유한 ${stock.name} 주식이 부족합니다. 현재 ${stock.name} ${formatDecimal(existingQuantity)}주를 보유하고 있습니다.`, ephemeral: true });
            }

            const newQuantity = existingQuantity.minus(quantity);

            // 3. Update user's stock holding
            if (newQuantity.isZero()) {
                await connection.query('DELETE FROM user_stocks WHERE user_id = ? AND stock_id = ?', [userId, stock.id]);
            } else {
                // Note: average_purchase_price doesn't change on sale
                await connection.query(
                    'UPDATE user_stocks SET quantity = ? WHERE user_id = ? AND stock_id = ?',
                    [newQuantity.toFixed(0), userId, stock.id]
                );
            }

            // 4. Update user's balance
            await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [totalPrice.toFixed(2), userId]);

            await connection.commit();
            await interaction.reply(`성공적으로 ${stock.name} ${formatDecimal(quantity)}주를 ${formatDecimal(totalPrice)}원에 매도했습니다.`);

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error(error);
            await interaction.reply({ content: '주식 매도 중 오류가 발생했습니다.', ephemeral: true });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};

