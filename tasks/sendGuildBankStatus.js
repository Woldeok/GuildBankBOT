const pool = require('../database');
require('dotenv').config();
const { formatDecimal } = require('../utils/numberUtils');
const Decimal = require('decimal.js');

const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => id.trim()) : [];

async function sendGuildBankStatus(client, title = '국가 은행 현황 업데이트') {
    if (!client) return;

    let connection;
    try {
        connection = await pool.getConnection();

        const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
        const guildBalance = guildBankRows.length > 0 ? new Decimal(guildBankRows[0].balance) : new Decimal(0);

        const [ownedStocks] = await connection.query(
            `SELECT s.name, s.symbol, gs.quantity, gs.average_purchase_price, s.price as current_price
             FROM guild_stocks gs
             JOIN stocks s ON gs.stock_id = s.id
             WHERE gs.guild_id = 1 AND gs.quantity > 0`
        );

        let stockReport = '**보유 주식 현황:**\n';
        let totalStockValue = new Decimal(0);
        if (ownedStocks.length > 0) {
            ownedStocks.forEach(stock => {
                const quantity = new Decimal(stock.quantity);
                const currentPrice = new Decimal(stock.current_price);
                const averagePurchasePrice = new Decimal(stock.average_purchase_price);

                const currentValue = quantity.times(currentPrice);
                const profit = currentPrice.minus(averagePurchasePrice).times(quantity);
                const profitRate = currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice).times(100);
                const sign = profit.greaterThanOrEqualTo(0) ? '+' : '';
                const color = profit.greaterThanOrEqualTo(0) ? '🟢' : '🔴';
                stockReport += `${color} ${stock.name}(${stock.symbol}): ${formatDecimal(quantity)}주 | 평가액: ${formatDecimal(currentValue)}원 | 수익: ${sign}${formatDecimal(profit)}원 (${profitRate.toFixed(2)}%)\n`;
                totalStockValue = totalStockValue.plus(currentValue);
            });
        } else {
            stockReport += '보유한 주식이 없습니다.\n';
        }

        const totalAssets = guildBalance.plus(totalStockValue);

        const finalMessage = `**🏦 ${title}**\n\n` +
                           `**총 자산:** ${formatDecimal(totalAssets)}원\n` +
                           `> 💰 현금: ${formatDecimal(guildBalance)}원\n` +
                           `> 📈 주식 평가액: ${formatDecimal(totalStockValue)}원\n\n` +
                           `${stockReport}`;

        for (const adminId of ADMIN_IDS) {
            try {
                const adminUser = await client.users.fetch(adminId);
                const messageChunks = finalMessage.match(/[\s\S]{1,1990}/g) || [];
                for (const chunk of messageChunks) {
                    await adminUser.send(chunk);
                }
            } catch (dmError) {
                console.error(`관리자 ${adminId}에게 은행 현황 DM 전송 실패:`, dmError);
            }
        }

    } catch (error) {
        console.error('은행 현황 조회 및 DM 발송 중 오류:', error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { sendGuildBankStatus };
