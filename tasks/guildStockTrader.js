const pool = require('../database');
require('dotenv').config();
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

async function guildAutoTradeStocks(client) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log('국가 은행 자동 주식 거래 시작...');
        let tradeSummary = '**일일 자동 주식 거래 결과:**\n\n';
        let hasTrade = false;

        // --- 판매 단계 ---
        const [ownedStocks] = await connection.query(
            `SELECT gs.stock_id, gs.quantity, gs.average_purchase_price, s.name, s.symbol, s.price as current_price
             FROM guild_stocks gs
             JOIN stocks s ON gs.stock_id = s.id
             WHERE gs.guild_id = 1 AND gs.quantity > 0`
        );

        for (const stock of ownedStocks) {
            const currentPrice = new Decimal(stock.current_price);
            const averagePurchasePrice = new Decimal(stock.average_purchase_price);
            const quantity = new Decimal(stock.quantity);

            const profitMargin = currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice);

            // 5% 이상 수익 발생 시 전량 매도
            if (profitMargin.greaterThan(0.05)) {
                const quantityToSell = quantity; // 전량 매도
                if (quantityToSell.greaterThan(0)) {
                    const sellValue = quantityToSell.times(currentPrice);

                    // 보유 주식 삭제
                    await connection.query('DELETE FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stock.stock_id]);
                    // 국가 은행 잔고 증가
                    await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [sellValue.toFixed(2)]);

                    const saleLog = `📈 **자동 매도:** ${stock.name}(${stock.symbol}) ${formatDecimal(quantityToSell)}주를 전량 매도. (+${formatDecimal(sellValue)}원, 수익률: ${profitMargin.times(100).toFixed(2)}%)\n`;
                    tradeSummary += saleLog;
                    hasTrade = true;
                    console.log(`자동 매도: ${stock.name} ${formatDecimal(quantityToSell)}주`);
                }
            }
        }

        // --- 구매 단계 (지능형) ---
        const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
        const guildBalance = guildBankRows.length > 0 ? new Decimal(guildBankRows[0].balance) : new Decimal(0);
        const investmentAmount = guildBalance.times(0.2).floor(); // 잔고의 20% 투자

        if (investmentAmount.greaterThan(1000)) { // 최소 투자 금액
            let stockToBuy = null;

            // 1. "물타기" - 보유 중인 주식 중 가장 손실이 큰 주식 매수
            const [lossyStocks] = await connection.query(
                `SELECT s.id, s.name, s.symbol, s.price, gs.average_purchase_price
                 FROM guild_stocks gs
                 JOIN stocks s ON gs.stock_id = s.id
                 WHERE gs.guild_id = 1 AND gs.quantity > 0 AND s.price < gs.average_purchase_price
                 ORDER BY (s.price / gs.average_purchase_price) ASC
                 LIMIT 1`
            );

            if (lossyStocks.length > 0) {
                stockToBuy = lossyStocks[0];
                console.log(`자동 매수 타겟 (손실 보전): ${stockToBuy.name}`);
            } else {
                // 2. "신규 투자" - 보유하지 않은 주식 중 가장 저렴한 주식 매수
                const [cheapestNewStocks] = await connection.query(
                    `SELECT s.id, s.name, s.symbol, s.price
                     FROM stocks s
                     LEFT JOIN guild_stocks gs ON s.id = gs.stock_id AND gs.guild_id = 1
                     WHERE gs.stock_id IS NULL OR gs.quantity = 0
                     ORDER BY s.price ASC
                     LIMIT 1`
                );
                if (cheapestNewStocks.length > 0) {
                    stockToBuy = cheapestNewStocks[0];
                    console.log(`자동 매수 타겟 (신규 투자): ${stockToBuy.name}`);
                }
            }

            if (stockToBuy && new Decimal(stockToBuy.price).greaterThan(0)) {
                const stockToBuyPrice = new Decimal(stockToBuy.price);
                const quantityToBuy = investmentAmount.dividedBy(stockToBuyPrice).floor();
                if (quantityToBuy.greaterThan(0)) {
                    const actualCost = quantityToBuy.times(stockToBuyPrice);

                    await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [actualCost.toFixed(2)]);

                    const [guildStockRows] = await connection.query('SELECT quantity, average_purchase_price FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stockToBuy.id]);

                    if (guildStockRows.length > 0) {
                        const existingStock = guildStockRows[0];
                        const existingQuantity = new Decimal(existingStock.quantity);
                        const existingAveragePurchasePrice = new Decimal(existingStock.average_purchase_price);

                        const newQuantity = existingQuantity.plus(quantityToBuy);
                        const newAveragePurchasePrice = (existingQuantity.times(existingAveragePurchasePrice).plus(actualCost)).dividedBy(newQuantity);
                        await connection.query(
                            'UPDATE guild_stocks SET quantity = ?, average_purchase_price = ? WHERE guild_id = 1 AND stock_id = ?',
                            [newQuantity.toFixed(0), newAveragePurchasePrice.toFixed(2), stockToBuy.id]
                        );
                    } else {
                        await connection.query(
                            'INSERT INTO guild_stocks (guild_id, stock_id, quantity, average_purchase_price) VALUES (?, ?, ?, ?)',
                            [1, stockToBuy.id, quantityToBuy.toFixed(0), stockToBuyPrice.toFixed(2)]
                        );
                    }
                    const buyLog = `📉 **자동 매수:** ${stockToBuy.name}(${stockToBuy.symbol}) ${formatDecimal(quantityToBuy)}주를 ${formatDecimal(actualCost)}원에 매수.\n`;
                    tradeSummary += buyLog;
                    hasTrade = true;
                    console.log(`자동 매수: ${stockToBuy.name} ${formatDecimal(quantityToBuy)}주`);
                }
            }
        } else {
            tradeSummary += 'ℹ️ 투자 금액이 부족하여 자동 매수를 건너뛰었습니다.\n';
        }

        await connection.commit();

        if (hasTrade) {
            console.log('✅ 국가 은행 자동 주식 거래 완료.');
            // 관리자에게 DM 전송
            if (client && ADMIN_IDS.length > 0) {
                for (const adminId of ADMIN_IDS) {
                    try {
                        const adminUser = await client.users.fetch(adminId);
                        await adminUser.send(tradeSummary);
                    } catch (dmError) {
                        console.error(`관리자 ${adminId}에게 자동 거래 결과 DM 전송 실패:`, dmError);
                    }
                }
            }
        } else {
            console.log('자동으로 거래할 주식이 없어 건너뜁니다.');
        }

    } catch (error) {
        console.error('국가 은행 자동 주식 거래 중 오류 발생:', error);
        if (connection) {
            await connection.rollback();
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { guildAutoTradeStocks };