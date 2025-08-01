const Decimal = require('decimal.js');

function parseDecimal(value, variableName = '값') {
    try {
        const dec = new Decimal(value);
        if (!dec.isFinite()) {
            throw new Error(`${variableName}의 값이 유효한 숫자가 아닙니다.`);
        }
        // Interpret input as units of 1000
        return dec.mul(1000);
    } catch (error) {
        throw new Error(`${variableName}의 값이 유효한 숫자가 아닙니다: ${error.message}`);
    }
}

function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDecimal(decimalValue) {
    // Display value in units of 1000, rounded to nearest integer, with thousand separators
    const valueInThousands = decimalValue.div(1000).toFixed(0);
    return formatNumberWithCommas(valueInThousands);
}

module.exports = { parseDecimal, formatDecimal };