const axios = require("axios");

module.exports = function createMarketModule() {
    return {
        async getMarketData(symbol = "BTCUSDT") {
            const [priceData, fundingData, narrativeData] = await Promise.all([
                fetchBinanceKlines(symbol),
                fetchBinanceFunding(symbol),
                fetchNewsNarrative(symbol)
            ]);

            return {
                prices: priceData.prices,
                volumes: priceData.volumes,
                volatility: priceData.volatility,
                fundingRate: fundingData,
                narrativeScore: narrativeData
            };
        }
    };
};

// ---------------- REAL DATA FUNCTIONS ---------------- //

async function fetchBinanceKlines(symbol) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=50`;
    const res = await axios.get(url);

    const prices = res.data.map(c => parseFloat(c[4])); // close prices
    const volumes = res.data.map(c => parseFloat(c[5]));

    // simple volatility calc
    const volatility =
        (Math.max(...prices) - Math.min(...prices)) /
        prices[prices.length - 1] * 100;

    return { prices, volumes, volatility };
}

async function fetchBinanceFunding(symbol) {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`;
    const res = await axios.get(url);
    return parseFloat(res.data[0].fundingRate) * 100; // convert to %
}

async function fetchNewsNarrative(symbol) {
    // Simple narrative scoring using CryptoPanic (free tier)
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=demo&currencies=BTC`;
    const res = await axios.get(url);

    const posts = res.data.results || [];

    let score = 50; // neutral baseline

    posts.forEach(p => {
        if (p.sentiment === "positive") score += 5;
        if (p.sentiment === "negative") score -= 5;
    });

    return Math.max(0, Math.min(100, score));
}
