import { config } from '../../config/env.js';

export default function createRiskEngine() {
    return {
        /**
         * 1. THE GATEKEEPER (Your Logic)
         * Validates if the market conditions are safe enough to trade.
         */
        validateSignal(signal, ticker) {
            if (!signal || signal.action === "HOLD") {
                return { allowed: false, reason: "No actionable signal" };
            }

            // A. Volatility filter (Don't trade in a tornado)
            const change = parseFloat(ticker.change_percentage);
            if (Math.abs(change) > 8) {
                return { allowed: false, reason: `Market too volatile (${change}%)` };
            }

            // B. Confidence filter (Only take A+ Setups)
            if (signal.confidence < 80) {
                return { allowed: false, reason: `Low confidence (${signal.confidence}%)` };
            }

            // C. Spread filter (Protect against low-liquidity wicks)
            const last = parseFloat(ticker.last);
            const mark = parseFloat(ticker.mark_price);
            const spread = Math.abs(last - mark) / last * 100;

            if (spread > 0.5) {
                return { allowed: false, reason: `Spread too high (${spread.toFixed(2)}%)` };
            }

            return { allowed: true, reason: "Clear to engage" };
        },

        /**
         * 2. THE ACCOUNTANT: DYNAMIC POSITION SIZING
         * Adjusts how much you buy based on the AI's Confidence Score.
         */
        calculatePositionSize(accountBalance, currentPrice, aiConfidence) {
            // Assume we want to risk a maximum of 3% of our total account per trade
            const maxRiskAmount = accountBalance * 0.03; 
            
            let rawSize = maxRiskAmount / currentPrice;

            // Scale size based on AI Conviction
            if (aiConfidence >= 95) {
                rawSize = rawSize * 1.5; // "A+" Setup: Go heavier
            }

            // Gate.io requires contract sizes to be integers
            return Math.max(1, Math.floor(rawSize)); 
        },

        /**
         * 3. THE SHIELD: VOLATILITY-ADJUSTED TARGETS
         * Calculates SL and TP dynamically.
         */
        calculateTargets(entryPrice, side, volatilityIndex) {
            const baseSlPercent = config.trading.defaultSlPercent / 100; // e.g., 2%
            const baseTpPercent = config.trading.defaultTpPercent / 100; // e.g., 5%
            
            // Widen stops slightly if the market is moving fast
            const volMultiplier = Math.min(1 + (volatilityIndex / 10), 1.5); 
            
            const dynamicSlPercent = baseSlPercent * volMultiplier;
            const dynamicTpPercent = baseTpPercent * volMultiplier;

            let stopLoss, takeProfit;

            if (side === "BUY" || side === "LONG") {
                stopLoss = entryPrice * (1 - dynamicSlPercent);
                takeProfit = entryPrice * (1 + dynamicTpPercent);
            } else {
                stopLoss = entryPrice * (1 + dynamicSlPercent);
                takeProfit = entryPrice * (1 - dynamicTpPercent);
            }

            return {
                stopLoss: stopLoss.toFixed(4), 
                takeProfit: takeProfit.toFixed(4)
            };
        }
    };
}
