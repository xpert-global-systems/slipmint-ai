export default function createIndicatorEngine() {
    // --- INTERNAL HELPERS ---
    // A true EMA calculates an array of values, so we can use it for the MACD Signal Line
    const calculateEmaArray = (prices, period) => {
        const k = 2 / (period + 1);
        let emaArr = [prices[0]]; // Start with the first price
        for (let i = 1; i < prices.length; i++) {
            emaArr.push(prices[i] * k + emaArr[i - 1] * (1 - k));
        }
        return emaArr;
    };

    return {
        /**
         * 1. RELATIVE STRENGTH INDEX (RSI)
         * Upgraded with Wilder's Smoothing Method to match TradingView exactly.
         */
        rsi(prices, period = 14) {
            if (prices.length < period + 1) return 50; // Neutral fallback

            let gains = 0, losses = 0;

            // Step 1: Calculate initial average gain/loss
            for (let i = 1; i <= period; i++) {
                const diff = prices[i] - prices[i - 1];
                if (diff >= 0) gains += diff;
                else losses -= diff;
            }

            let avgGain = gains / period;
            let avgLoss = losses / period;

            // Step 2: Wilder's Smoothing for the rest of the dataset
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
            return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
        },

        /**
         * 2. EXPONENTIAL MOVING AVERAGE (EMA)
         * Returns the single most recent EMA value for quick trend checks.
         */
        ema(prices, period = 20) {
            if (prices.length < period) return null;
            const emaArray = calculateEmaArray(prices, period);
            return parseFloat(emaArray[emaArray.length - 1].toFixed(4));
        },

        /**
         * 3. FULL MACD (Moving Average Convergence Divergence)
         * Upgraded to return the Line, Signal, and Histogram for crossover detection.
         */
        macd(prices) {
            if (prices.length < 34) return null; // Needs enough data for 26 + 9 smoothing

            const ema12 = calculateEmaArray(prices, 12);
            const ema26 = calculateEmaArray(prices, 26);
            
            // Calculate the MACD Line array
            const macdLineArr = ema12.map((val, i) => val - ema26[i]);

            // Calculate the Signal Line (9-period EMA of the MACD Line)
            const signalLineArr = calculateEmaArray(macdLineArr, 9);

            const currentMacd = macdLineArr[macdLineArr.length - 1];
            const currentSignal = signalLineArr[signalLineArr.length - 1];
            
            // The Histogram shows the distance between MACD and Signal
            const histogram = currentMacd - currentSignal;

            return {
                macdLine: parseFloat(currentMacd.toFixed(4)),
                signalLine: parseFloat(currentSignal.toFixed(4)),
                histogram: parseFloat(histogram.toFixed(4))
            };
        },

        /**
         * 4. VOLUME WEIGHTED AVERAGE PRICE (VWAP)
         * Excellent for detecting true institutional support/resistance levels.
         */
        vwap(candles) {
            if (!candles || candles.length === 0) return null;

            let cumulativePV = 0;
            let cumulativeVolume = 0;

            for (const c of candles) {
                // Typical Price = (High + Low + Close) / 3
                const typical = (c.high + c.low + c.close) / 3;
                cumulativePV += typical * c.volume;
                cumulativeVolume += c.volume;
            }

            if (cumulativeVolume === 0) return null;
            return parseFloat((cumulativePV / cumulativeVolume).toFixed(4));
        }
    };
}
