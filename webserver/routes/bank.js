const express = require('express');
const router = express.Router();
const pool = require('../../database'); // 봇의 database.js 경로
const Decimal = require('decimal.js'); // Decimal.js 임포트
const { formatDecimal } = require('../../utils/numberUtils'); // formatDecimal 임포트

// 로그인 확인 미들웨어
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/'); // 로그인되지 않았으면 로그인 페이지로 리디렉션
    }
}

router.get('/bank-status', isAuthenticated, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 국가 은행 잔고
        const [guildBankRows] = await connection.query('SELECT balance FROM guild_bank WHERE id = 1');
        const guildBalance = guildBankRows.length > 0 ? new Decimal(guildBankRows[0].balance) : new Decimal(0);

        // 2. 보유 주식 현황 및 평가액
        const [ownedStocksRaw] = await connection.query(
            `SELECT s.name, s.symbol, gs.quantity, gs.average_purchase_price, s.price as current_price
             FROM guild_stocks gs
             JOIN stocks s ON gs.stock_id = s.id
             WHERE gs.guild_id = 1 AND gs.quantity > 0`
        );

        let totalStockValue = new Decimal(0);
        const ownedStocks = ownedStocksRaw.map(stock => {
            const quantity = new Decimal(stock.quantity);
            const currentPrice = new Decimal(stock.current_price);
            const averagePurchasePrice = new Decimal(stock.average_purchase_price);

            const currentValue = quantity.times(currentPrice);
            const profit = currentPrice.minus(averagePurchasePrice).times(quantity);
            const profitRate = averagePurchasePrice.isZero() ? new Decimal(0) : currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice).times(100);

            totalStockValue = totalStockValue.plus(currentValue);

            return {
                ...stock,
                quantity: quantity, // Decimal 객체로 유지
                current_price: currentPrice, // Decimal 객체로 유지
                average_purchase_price: averagePurchasePrice, // Decimal 객체로 유지
                currentValue: currentValue,
                profit: profit,
                profitRate: profitRate
            };
        });

        // 3. 총 대출액
        const [loanStats] = await connection.query("SELECT SUM(amount) as totalLoanAmount FROM loans WHERE status = 'active'");
        const totalLoanAmount = new Decimal(loanStats[0].totalLoanAmount || 0);

        res.render('bank_status', {
            guildBalance: guildBalance,
            ownedStocks: ownedStocks,
            totalStockValue: totalStockValue,
            totalLoanAmount: totalLoanAmount,
            formatDecimal: formatDecimal // EJS 템플릿에서 사용할 함수 전달
        });

    } catch (error) {
        console.error('은행 현황 페이지 로드 중 오류 발생:', error);
        res.status(500).send('은행 현황을 불러오는 데 실패했습니다.');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.get('/my-status', isAuthenticated, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const userId = req.session.user.id;

        // 1. 사용자 잔고
        const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
        const userBalance = userRows.length > 0 ? new Decimal(userRows[0].balance) : new Decimal(0);

        // 2. 보유 주식 현황 및 평가액
        const [ownedStocksRaw] = await connection.query(
            `SELECT s.name, s.symbol, us.quantity, us.average_purchase_price, s.price as current_price
             FROM user_stocks us
             JOIN stocks s ON us.stock_id = s.id
             WHERE us.user_id = ? AND us.quantity > 0`,
            [userId]
        );

        let totalStockValue = new Decimal(0);
        const ownedStocks = ownedStocksRaw.map(stock => {
            const quantity = new Decimal(stock.quantity);
            const currentPrice = new Decimal(stock.current_price);
            const averagePurchasePrice = new Decimal(stock.average_purchase_price);

            const currentValue = quantity.times(currentPrice);
            const profit = currentPrice.minus(averagePurchasePrice).times(quantity);
            const profitRate = averagePurchasePrice.isZero() ? new Decimal(0) : currentPrice.minus(averagePurchasePrice).dividedBy(averagePurchasePrice).times(100);

            totalStockValue = totalStockValue.plus(currentValue);

            return {
                ...stock,
                quantity: quantity,
                current_price: currentPrice,
                average_purchase_price: averagePurchasePrice,
                currentValue: currentValue,
                profit: profit,
                profitRate: profitRate
            };
        });

        // 3. 총 대출액 (사용자 본인의 대출만)
        const [loanStats] = await connection.query("SELECT SUM(amount) as totalLoanAmount FROM loans WHERE user_id = ? AND status = 'active'", [userId]);
        const totalLoanAmount = new Decimal(loanStats[0].totalLoanAmount || 0);

        res.render('my_status', {
            userBalance: userBalance,
            ownedStocks: ownedStocks,
            totalStockValue: totalStockValue,
            totalLoanAmount: totalLoanAmount,
            formatDecimal: formatDecimal
        });

    } catch (error) {
        console.error('내 현황 페이지 로드 중 오류 발생:', error);
        res.status(500).send('내 현황을 불러오는 데 실패했습니다.');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;