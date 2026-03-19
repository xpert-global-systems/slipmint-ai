export default function createSignalEngine() {
    return {
        /**
         * Evaluates the deep market data and returns a calculated Confidence Score.
         * @param {Object} marketContext - The data object from your marketData.js
         */
        async evaluate(marketContext) {
            // 1. Safety Check
            if (!marketContext || !marketContext.technical_analysis) {
                return { action: "HOLD", confidence: 0, reason: "Insufficient data" };
            }

            const { technical_analysis, fundingRate, narrativeScore } = marketContext;
            const { rsi_14, trend_status } = technical_analysis;

            // 2. Initialize Weighted Scoring (Max Score = 100)
            let buyScore = 0;
            let sellScore = 0;
            let triggers = []; // To tell us exactly WHY it took the trade

            // --- DEEP STRATEGY LOGIC ---

            // A. Macro Trend (Weight: 30 Points)
            if (trend_status === "BULLISH") {
                buyScore += 30;
                triggers.push("Macro Bullish Trend");
            } else if (trend_status === "BEARISH") {
                sellScore += 30;
                triggers.push("Macro Bearish Trend");
            }

            // B. RSI Reversion / Momentum (Weight: 40 Points)
            // RSI below 30 is heavily oversold (Great time to Buy)
            if (rsi_14 < 30) {
                buyScore += 40;
                triggers.push(`RSI Oversold (${rsi_14})`);
            } else if (rsi_14 < 45) {
                buyScore += 15; // Mildly undervalued
            }
            
            // RSI above 70 is heavily overbought (Great time to Sell/Short)
            if (rsi_14 > 70) {
                sellScore += 40;
                triggers.push(`RSI Overbought (${rsi_14})`);
            } else if (rsi_14 > 55) {
                sellScore += 15; // Mildly overvalued
            }

            // C. News/Narrative Sentiment (Weight: 20 Points)
            // Driven by CryptoPanic data
            if (narrativeScore >= 65) {
                buyScore += 20;
                triggers.push("Strong Positive News");
            } else if (narrativeScore <= 35) {
                sellScore += 20;
                triggers.push("Strong Negative News");
            }

            // D. Funding Rate Squeeze (Weight: 10 Points)
            // Negative funding = shorts are paying longs (Bullish squeeze potential)
            if (fundingRate < -0.01) {
                buyScore += 10;
                triggers.push("Negative Funding Squeeze");
            } 
            // High positive funding = market is too greedy (Bearish squeeze potential)
            else if (fundingRate > 0.05) {
                sellScore += 10;
                triggers.push("Over-leveraged Longs");
            }

            // 3. Final Decision Gate
            let finalAction = "HOLD";
            let finalConfidence = Math.max(buyScore, sellScore);

            // The Sniper Filter: Only act if one side heavily outweighs the other
            if (buyScore > sellScore && buyScore >= 70) {
                finalAction = "BUY";
            } else if (sellScore > buyScore && sellScore >= 70) {
                finalAction = "SELL";
            }

            return {
                action: finalAction,
                confidence: finalConfidence,
                reason: triggers.join(" | ")
            };
        }
    };
}
