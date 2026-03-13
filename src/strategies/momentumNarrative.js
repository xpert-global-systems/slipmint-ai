// src/strategies/momentumNarrative.js

/**
 * Momentum + Narrative Confirmation Strategy
 * ------------------------------------------
 * This module consumes unified market data from the Market Service
 * and produces actionable strategy signals for SlipMint AI.
 */

module.exports = function createMomentumNarrativeStrategy({ marketService }) {
    
    // -----------------------------
    // 1. MOMENTUM SCORE
    // -----------------------------
    function computeMomentumScore(priceData) {
        if (!priceData || priceData.length < 2) return 0;

        const latest = priceData[priceData.length - 1];
        const prev = priceData[priceData.length - 2];

        const pctChange = ((latest - prev) / prev) * 100;

        // Normalize to 0–100
        return Math.max(0, Math.min(100, pctChange * 5));
    }

    // -----------------------------
    // 2. NARRATIVE SCORE
    // -----------------------------
    function computeNarrativeScore(metadata) {
        if (!metadata || !metadata.narrativeScore) return 0;

        // Already normalized 0–100 from metadata
        return metadata.narrativeScore;
    }

    // -----------------------------
    // 3. VOLUME SIGNAL
    // -----------------------------
    function computeVolumeSignal(volumeData) {
        if (!volumeData || volumeData.length < 10) return 0;

        const recent = volumeData.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const baseline = volumeData.slice(0, -3).reduce((a, b) => a + b, 0) / (volumeData.length - 3);

        const ratio = recent / baseline;

        if (ratio > 1.5) return 80;   // strong inflow
        if (ratio > 1.2) return 60;   // moderate inflow
        if (ratio > 1.0) return 40;   // slight inflow
        return 20;                    // weak or negative
    }

    // -----------------------------
    // 4. VOLATILITY SIGNAL
    // -----------------------------
    function computeVolatilitySignal(priceData) {
        if (!priceData || priceData.length < 10) return 0;

        const returns = priceData.slice(1).map((p, i) => (p - priceData[i]) / priceData[i]);
        const std = Math.sqrt(returns.reduce((a, r) => a + r * r, 0) / returns.length);

        // Normalize volatility
        const vol = std * 1000;

        if (vol < 5) return 80;   // compression (bullish breakout potential)
        if (vol < 10) return 60;  // normal
        return 30;                // expansion (risk)
    }

    // -----------------------------
    // 5. FUNDING BIAS
    // -----------------------------
    function computeFundingBias(metadata) {
        if (!metadata || typeof metadata.fundingRate !== "number") return 50;

        const fr = metadata.fundingRate;

        if (fr > 0.01) return 70;   // bullish bias
        if (fr > 0) return 55;      // slight bullish
        if (fr < -0.01) return 30;  // bearish bias
        return 45;                  // slight bearish
    }

    // -----------------------------
    // 6. ENTRY SIGNAL
    // -----------------------------
    function generateEntrySignal(scores) {
        const {
            momentum,
            narrative,
            volume,
            volatility,
            funding
        } = scores;

        const composite =
            momentum * 0.35 +
            narrative * 0.25 +
            volume * 0.15 +
            volatility * 0.15 +
            funding * 0.10;

        return {
            composite,
            shouldEnter: composite >= 65,
            confidence: composite
        };
    }

    // -----------------------------
    // 7. EXIT SIGNAL
    // -----------------------------
    function generateExitSignal(scores) {
        const {
            momentum,
            narrative,
            volume,
            volatility,
            funding
        } = scores;

        const composite =
            momentum * 0.40 +
            narrative * 0.20 +
            volume * 0.15 +
            volatility * 0.15 +
            funding * 0.10;

        return {
            composite,
            shouldExit: composite <= 45,
            confidence: 100 - composite
        };
    }

    // -----------------------------
    // 8. MAIN STRATEGY EXECUTION
    // -----------------------------
    async function run(symbol = "BTCUSDT") {
        const market = await marketService.getMarketData(symbol);

        const scores = {
            momentum: computeMomentumScore(market.prices),
            narrative: computeNarrativeScore(market.metadata),
            volume: computeVolumeSignal(market.volumes),
            volatility: computeVolatilitySignal(market.prices),
            funding: computeFundingBias(market.metadata)
        };

        return {
            symbol,
            scores,
            entry: generateEntrySignal(scores),
            exit: generateExitSignal(scores),
            timestamp: Date.now()
        };
    }

    return {
        run,
        computeMomentumScore,
        computeNarrativeScore,
        computeVolumeSignal,
        computeVolatilitySignal,
        computeFundingBias,
        generateEntrySignal,
        generateExitSignal
    };
};
