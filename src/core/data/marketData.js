const axios = require("axios");
// Ensure you have your real CryptoPanic key in your .env file
// const CP_KEY = process.env.CRYPTOPANIC_API_KEY || "demo"; 

module.exports = function createMarketModule() {
    return {
        async getMarketData(symbol = "BTCUSDT") {
            console.log(`📡 [Data Engine] Pulling deep metrics for ${symbol}...`);

            // 1. Bulletproof Parallel Fetching
            // If one fails, the others still resolve (allSettled instead of all)
            const [priceRes, fundingRes, narrativeRes] = await Promise.allSettled([
                fetchBinanceKlines(symbol),
                fetchBinanceFunding(symbol),
                fetchNewsNarrative(symbol)
            ]);

            // 2. Safely Extract Data (Fallbacks if APIs fail)
            const priceData = priceRes.status === "fulfilled" ? priceRes.value : null;
            const fundingData = fundingRes.status === "fulfilled" ? fundingRes.value : 0;
            const narrativeData = narrativeRes.status === "fulfilled" ? narrativeRes.value : 50;

            if (!priceData) {
                console.error(`❌ [Data Engine] Critical failure fetching price for ${symbol}`);
                return null; // Abort if we don't have price data
            }

            return {
                asset: symbol,
                currentPrice: priceData.currentPrice,
                technical_analysis: {
                    rsi_14: priceData.rsi,
                    trend_status: priceData.trend,
                    volatility_index: priceData.volatility,
                },
                fundingRate: fundingData,
                narrativeScore: narrativeData,
                timestamp: new Date().toISOString()
            };
        }
    };
};

// ---------------- REAL DATA & MATH FUNCTIONS ---------------- //

async function fetchBinanceKlines(symbol) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=50`;
    const res = await axios.get(url);

    const closes = res.data.map(c => parseFloat(c[4]));
    const currentPrice = closes[closes.length - 1];

    // DEEP STRATEGY: Calculate RSI (Relative Strength Index)
    const rsi = calculateRSI(closes, 14);

    // DEEP STRATEGY: Define the Trend (Is current price above the 50-period average?)
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const trend = currentPrice > avgPrice ? "BULLISH" : "BEARISH";

    // Clean Volatility Calc (High-Low spread vs current price)
    const max = Math.max(...closes);
    const min = Math.min(...closes);
    const volatility = ((max - min) / currentPrice) * 100;

    return { 
        currentPrice, 
        rsi: parseFloat(rsi.toFixed(2)), 
        trend, 
        volatility: parseFloat(volatility.toFixed(2)) 
    };
}

async function fetchBinanceFunding(symbol) {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`;
    const res = await axios.get(url);
    // Convert to percentage and format to 4 decimals
    return parseFloat((parseFloat(res.data[0].fundingRate) * 100).toFixed(4)); 
}

async function fetchNewsNarrative(symbol) {
    // Fix: Dynamically extract the base coin (e.g., "BTC" from "BTCUSDT")
    const coin = symbol.replace("USDT", ""); 
    
    // Note: Replace "demo" with your actual API key for production
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${process.env.CRYPTOPANIC_API_KEY || 'demo'}&currencies=${coin}`;
    
    try {
        const res = await axios.get(url);
        const posts = res.data.results || [];

        let score = 50; // Neutral baseline (0 = Extreme Fear, 100 = Extreme Greed)

        // Weighted Sentiment Scoring
        posts.forEach(p => {
            const votes = p.votes || {};
            if (votes.positive > votes.negative) score += 2;
            if (votes.negative > votes.positive) score -= 2;
            if (votes.important > 0) score += 3; // Boost score if news is marked "Important"
        });

        return Math.max(0, Math.min(100, score)); // Clamp between 0 and 100
    } catch (error) {
        console.error(`⚠️ [CryptoPanic] API Limit Reached or Failed for ${coin}. Defaulting to neutral (50).`);
        return 50;
    }
}

// --- UTILITY: RSI Math Engine ---
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50; // Not enough data
    
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}
