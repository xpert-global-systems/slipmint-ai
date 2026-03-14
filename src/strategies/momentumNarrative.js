// src/strategies/momentumNarrative.js

module.exports = function createMomentumNarrativeStrategy({ marketService }) {

    // -----------------------------
    // 1. MOMENTUM SCORE (REAL)
    // -----------------------------
    function scoreMomentum(prices) {
        if (!prices || prices.length < 10) return 50;

        const recent = prices.slice(-10);
        const first = recent[0];
        const last = recent[recent.length - 1];

        const pct = ((last - first) / first) * 100;

        if (pct > 5) return 90;
        if (pct > 2) return 75;
        if (pct > 0.5) return 60;
        if (pct > -0.5) return 50;
        if (pct > -2) return 40;
        if (pct > -5) return 25;
        return 10;
    }

    // -----------------------------
    // 2. NARRATIVE SCORE (REAL)
    // -----------------------------
    function scoreNarrative(n) {
        if (n == null) return 50;
        return Math.max(0, Math.min(100, n));
    }

    // -----------------------------
    // 3. VOLUME ANOMALY (REAL)
    // -----------------------------
    function scoreVolume(volumes) {
        if (!volumes || volumes.length < 20) return 50;

        const recent = avg(volumes.slice(-5));
        const baseline = avg(volumes.slice(-20, -5));

        const ratio = baseline === 0 ? 1 : recent / baseline;

        if (ratio > 2.5) return 90;
        if (ratio > 1.8) return 80;
        if (ratio > 1.3) return 65;
        if (ratio > 0.8) return 50;
        if (ratio > 0.5) return 35;
        return 20;
    }

    // -----------------------------
    // 4. VOLATILITY SIGNAL (REAL)
    // -----------------------------
    function scoreVolatility(volatilityPct) {
        if (volatilityPct == null) return 50;

        const v = Math.abs(volatilityPct);

        if (v >= 2 && v <= 6) return 80;  // ideal breakout zone
        if (v > 6 && v <= 10) return 60;
        if (v > 10) return 35;           // too chaotic
        if (v >= 1 && v < 2) return 55;
        return 40;
    }

    // -----------------------------
    // 5. FUNDING BIAS (REAL)
    // -----------------------------
    function scoreFunding(fundingRatePct) {
        if (fundingRatePct == null) return 50;

        const f = fundingRatePct;

        if (f > 0.05) return 35;   // crowded longs → bearish
        if (f > 0.02) return 45;
        if (f > -0.02) return 55;  // neutral
        if (f > -0.05) return 65;  // shorts paying → bullish
        return 75;
    }

    // -----------------------------
    // 6. ENTRY COMPOSITE
    // -----------------------------
    function computeEntryComposite(s) {
        return (
            s.momentum * 0.30 +
            s.volume * 0.20 +
            s.volatility * 0.15 +
            s.funding * 0.15 +
            s.narrative * 0.20
        );
    }

    // -----------------------------
    // 7. EXIT COMPOSITE
    // -----------------------------
    function computeExitComposite(s) {
        const invMomentum = 100 - s.momentum;
        const invVolume = 100 - s.volume;
        const invNarrative = 100 - s.narrative;

        return (
            invMomentum * 0.35 +
            invVolume * 0.20 +
            invNarrative * 0.20 +
            s.funding * 0.15 +
            s.volatility * 0.10
        );
    }

    // -----------------------------
    // 8. MAIN STRATEGY EXECUTION
    // -----------------------------
    async function run(symbol = "BTCUSDT") {
        const market = await marketService.getMarketData(symbol);

        const scores = {
            momentum: scoreMomentum(market.prices),
            narrative: scoreNarrative(market.narrativeScore),
            volume: scoreVolume(market.volumes),
            volatility: scoreVolatility(market.volatility),
            funding: scoreFunding(market.fundingRate)
        };

        const entryComposite = computeEntryComposite(scores);
        const exitComposite = computeExitComposite(scores);

        return {
            symbol,
            scores,
            entry: {
                composite: entryComposite,
                shouldEnter: entryComposite > 65,
                confidence: entryComposite
            },
            exit: {
                composite: exitComposite,
                shouldExit: exitComposite > 55,
                confidence: exitComposite
            },
            timestamp: Date.now()
        };
    }

    // -----------------------------
    // UTIL
    // -----------------------------
    function avg(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    return { run };
};
