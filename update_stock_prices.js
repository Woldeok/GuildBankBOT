const pool = require('./database');
require('dotenv').config(); // .env 파일 로드

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

const { sendGuildBankStatus } = require('./tasks/sendGuildBankStatus');
const { parseDecimal, formatDecimal } = require('./utils/numberUtils');
const Decimal = require('decimal.js');

// 각 주식의 이전 변동 방향을 저장할 객체 (봇 재시작 시 초기화됨)
const lastChangeDirection = {}; // { stockId: 'up' | 'down' | 'none' }

async function updateStockPrices(client) {
    let connection;
    const priceChanges = []; // 가격 변동 내역을 저장할 배열

    try {
        connection = await pool.getConnection();
        

        const [stocks] = await connection.query('SELECT id, name, symbol, price FROM stocks'); // name, symbol도 가져오도록 수정

        for (const stock of stocks) {
            const currentPrice = new Decimal(stock.price);
            let changePercentage;

            // 이전 변동 방향에 따른 모멘텀 적용
            const direction = lastChangeDirection[stock.id] || 'none';
            const randomFactor = new Decimal(Math.random()); // 0.0 ~ 1.0

            if (direction === 'up') {
                // 이전에 올랐으면, 오를 확률을 높임 (예: 60% 확률로 오름)
                if (randomFactor.lessThan(0.6)) {
                    changePercentage = new Decimal(Math.random()).times(0.05).plus(0.005); // +0.5% ~ +5%
                } else {
                    changePercentage = new Decimal(Math.random()).times(-0.05).minus(0.005); // -0.5% ~ -5%
                }
            } else if (direction === 'down') {
                // 이전에 내렸으면, 내릴 확률을 높임 (예: 60% 확률로 내림)
                if (randomFactor.lessThan(0.6)) {
                    changePercentage = new Decimal(Math.random()).times(-0.05).minus(0.005); // -0.5% ~ -5%
                } else {
                    changePercentage = new Decimal(Math.random()).times(0.05).plus(0.005); // +0.5% ~ +5%
                }
            } else {
                // 첫 변동이거나 이전 방향이 없으면 무작위
                changePercentage = new Decimal(Math.random()).times(0.1).minus(0.05); // -5% ~ +5%
            }

            // 가격 변동폭 제한 (예: 하루 최대 20%)
            const maxChange = new Decimal(0.20);
            if (changePercentage.abs().greaterThan(maxChange)) {
                changePercentage = maxChange.times(changePercentage.s); // Math.sign 대신 .s 사용
            }

            let newPrice = currentPrice.times(new Decimal(1).plus(changePercentage));

            // 가격이 1원 미만으로 떨어지지 않도록 보정
            if (newPrice.lessThan(1)) {
                newPrice = new Decimal(1);
            }

            // 새로운 변동 방향 저장
            if (newPrice.greaterThan(currentPrice)) {
                lastChangeDirection[stock.id] = 'up';
            } else if (newPrice.lessThan(currentPrice)) {
                lastChangeDirection[stock.id] = 'down';
            } else {
                lastChangeDirection[stock.id] = 'none';
            }

            await connection.query('UPDATE stocks SET price = ? WHERE id = ?', [newPrice.toFixed(2), stock.id]);

            // 가격 변동 내역 저장
            const priceDiff = newPrice.minus(currentPrice);
            if (!priceDiff.isZero()) {
                priceChanges.push({
                    name: stock.name,
                    symbol: stock.symbol,
                    oldPrice: currentPrice,
                    newPrice: newPrice,
                    diff: priceDiff,
                    percentage: priceDiff.dividedBy(currentPrice).times(100)
                });
            }
        }
        console.log('주식 가격 조정 완료.');

        console.log('주식 가격 조정 완료.');

        // --- 자동 거래 로직 시작 ---
        if (client) {
            await connection.beginTransaction();
            try {
                let tradeOccurred = false;
                let tradeSummary = '**자동 주식 거래 알림:**\n';

                // 1. 자동 매도 (수익 실현)
                const [ownedStocks] = await connection.query(
                    `SELECT gs.stock_id, gs.quantity, gs.average_purchase_price, s.name, s.symbol, s.price as current_price
                     FROM guild_stocks gs JOIN stocks s ON gs.stock_id = s.id WHERE gs.guild_id = 1 AND gs.quantity > 0`
                );

                for (const stock of ownedStocks) {
                    const currentPrice = new Decimal(stock.current_price);
                    const averagePurchasePrice = new Decimal(stock.average_purchase_price);
                    const profitMargin = currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice);

                    if (profitMargin.greaterThan(0.05)) { // 5% 이상 수익 시 전량 매도
                        const sellValue = new Decimal(stock.quantity).times(currentPrice); // Use Decimal
                        await connection.query('DELETE FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stock.stock_id]);
                        await connection.query('UPDATE guild_bank SET balance = balance + ? WHERE id = 1', [sellValue.toFixed(2)]);
                        tradeSummary += `📈 **자동 매도:** ${stock.name} ${stock.quantity}주 전량 매도 (+${formatDecimal(sellValue)}원, 수익률: ${profitMargin.times(100).toFixed(2)}%)\n`;
                        tradeOccurred = true;
                    }
                }

                // 2. 자동 매수 (급락 시)
                const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
                const guildBalance = guildBankRows.length > 0 ? new Decimal(guildBankRows[0].balance) : new Decimal(0);
                const investmentPerStock = guildBalance.times(0.1).floor(); // 주식 당 투자액 (잔고의 10%)

                if (investmentPerStock.greaterThan(1000)) { // 최소 투자 금액
                    for (const change of priceChanges) {
                        if (change.percentage.lessThanOrEqualTo(-5)) { // 5% 이상 하락 시 매수
                            const stockToBuy = stocks.find(s => s.symbol === change.symbol);
                            const quantityToBuy = investmentPerStock.dividedBy(change.newPrice).floor();

                            if (quantityToBuy.greaterThan(0)) {
                                const actualCost = quantityToBuy.times(change.newPrice); // Use Decimal
                                if (guildBalance.greaterThanOrEqualTo(actualCost)) {
                                    await connection.query('UPDATE guild_bank SET balance = balance - ? WHERE id = 1', [actualCost.toFixed(2)]);

                                    const [guildStockRows] = await connection.query('SELECT quantity, average_purchase_price FROM guild_stocks WHERE guild_id = 1 AND stock_id = ?', [stockToBuy.id]);
                                    if (guildStockRows.length > 0) {
                                        const existing = guildStockRows[0];
                                        const newQuantity = new Decimal(existing.quantity).plus(quantityToBuy);
                                        const newAvgPrice = (new Decimal(existing.quantity).times(new Decimal(existing.average_purchase_price)).plus(actualCost)).dividedBy(newQuantity);
                                        await connection.query('UPDATE guild_stocks SET quantity = ?, average_purchase_price = ? WHERE guild_id = 1 AND stock_id = ?', [newQuantity.toFixed(0), newAvgPrice.toFixed(2), stockToBuy.id]);
                                    } else {
                                        await connection.query('INSERT INTO guild_stocks (guild_id, stock_id, quantity, average_purchase_price) VALUES (?, ?, ?, ?)', [1, stockToBuy.id, quantityToBuy.toFixed(0), change.newPrice.toFixed(2)]);
                                    }
                                    tradeSummary += `📉 **자동 매수:** ${stockToBuy.name} ${formatDecimal(quantityToBuy)}주 매수 (-${formatDecimal(actualCost)}원)\n`;
                                    tradeOccurred = true;
                                }
                            }
                        }
                    }
                }

                if (tradeOccurred) {
                    await connection.commit();
                    console.log('자동 거래 발생, 관리자에게 현황 전송.');
                    await sendGuildBankStatus(client, '실시간 자동 거래 완료');
                } else {
                    await connection.rollback();
                }
            } catch (tradeError) {
                await connection.rollback();
                console.error('자동 거래 중 오류 발생:', tradeError);
            }
        }

    } catch (error) {
        console.error('주식 가격 조정 중 오류 발생:', error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// 이 스크립트를 직접 실행할 경우를 대비
if (require.main === module) {
    // 직접 실행 시에는 client 객체가 없으므로 DM 전송 기능은 작동하지 않음
    updateStockPrices(null).then(() => {
        console.log('Stock price update script finished.');
    });
}

module.exports = updateStockPrices;