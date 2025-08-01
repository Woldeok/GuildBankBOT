
const { SlashCommandBuilder } = require('discord.js');
const pool = require('../database');
const { parseDecimal, formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('주식매수')
        .setDescription('주식을 매수합니다.')
        .addStringOption(option =>
            option.setName('stock')
                .setDescription('매수할 주식의 종목명 또는 심볼')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option => // Changed to StringOption
            option.setName('수량')
                .setDescription('매수할 주식의 수량')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // 즉시 응답을 지연시킴

        const stockIdentifier = interaction.options.getString('stock');
        const quantityString = interaction.options.getString('수량'); // Get as string
        const userId = interaction.user.id;
        let quantity;

        try {
            quantity = parseDecimal(quantityString, '수량');
        } catch (error) {
            return interaction.editReply({ content: error.message });
        }

        if (quantity.lessThanOrEqualTo(0)) {
            return interaction.editReply({ content: '수량은 1 이상이어야 합니다.' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Get user's balance
            const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) {
                await connection.rollback();
                return interaction.editReply({ content: '가입 먼저 진행해주세요. `/가입`' });
            }
            const userBalance = new Decimal(userRows[0].balance);

            // 2. Get stock info
            const [stockRows] = await connection.query('SELECT id, name, price FROM stocks WHERE name = ? OR symbol = ?', [stockIdentifier, stockIdentifier]);
            if (stockRows.length === 0) {
                await connection.rollback();
                return interaction.editReply({ content: '해당 주식을 찾을 수 없습니다. 정확한 종목명 또는 심볼을 입력해주세요.' });
            }
            const stock = stockRows[0];
            const stockPrice = new Decimal(stock.price);
            const totalPrice = stockPrice.times(quantity);

            // 3. Check if user has enough balance
            if (userBalance.lessThan(totalPrice)) {
                await connection.rollback();
                return interaction.editReply({ content: `잔액이 부족합니다. ${stock.name} ${formatDecimal(quantity)}주를 매수하려면 ${formatDecimal(totalPrice)}원이 필요합니다. 현재 잔액: ${formatDecimal(userBalance)}원` });
            }

            // 4. Update user's balance
            await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalPrice.toFixed(2), userId]);

            // 5. Update user_stocks
            const [userStockRows] = await connection.query('SELECT quantity, average_purchase_price FROM user_stocks WHERE user_id = ? AND stock_id = ?', [userId, stock.id]);

            if (userStockRows.length > 0) {
                // Update existing stock
                const existingQuantity = new Decimal(userStockRows[0].quantity);
                const existingAveragePurchasePrice = new Decimal(userStockRows[0].average_purchase_price);
                
                const newQuantity = existingQuantity.plus(quantity);
                const newAveragePurchasePrice = 
                    (existingQuantity.times(existingAveragePurchasePrice).plus(totalPrice)).dividedBy(newQuantity);
                
                await connection.query(
                    'UPDATE user_stocks SET quantity = ?, average_purchase_price = ? WHERE user_id = ? AND stock_id = ?',
                    [newQuantity.toFixed(0), newAveragePurchasePrice.toFixed(2), userId, stock.id]
                );
            } else {
                // Insert new stock
                await connection.query(
                    'INSERT INTO user_stocks (user_id, stock_id, quantity, average_purchase_price) VALUES (?, ?, ?, ?)',
                    [userId, stock.id, quantity.toFixed(0), stockPrice.toFixed(2)] // 매수 시에는 현재 주식 가격이 평균 매수 가격이 됨
                );
            }

            await connection.commit();
            await interaction.editReply(`성공적으로 ${stock.name} ${formatDecimal(quantity)}주를 ${formatDecimal(totalPrice)}원에 매수했습니다.`);

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error(error);
            await interaction.editReply({ content: '주식 매수 중 오류가 발생했습니다.' });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};
