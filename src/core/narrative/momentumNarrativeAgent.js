// src/agents/momentumNarrativeAgent.js

/**
 * Momentum + Narrative Agent
 * --------------------------
 * Wraps the raw strategy output into human-readable,
 * decision-focused signals for SlipMint AI.
 */

module.exports = function createMomentumNarrativeAgent({ strategy }) {
    async function evaluate(symbol = "BTCUSDT") {
        const result = await strategy.run(symbol);

        const { scores, entry, exit } = result;

        const decision = decideAction({ entry, exit });
        const confidence = computeConfidence({ entry, exit, decision });
        const reasoning = buildReasoning({ scores, entry, exit, decision });

        return {
            symbol: result.symbol,
            action: decision,
            confidence,
            reasoning,
            raw: result,
            generatedAt: new Date().toISOString()
        };
    }

    return { evaluate };
};

// -----------------------------
// DECISION LOGIC
// -----------------------------

function decideAction({ entry, exit }) {
    if (entry.shouldEnter && !exit.shouldExit) return "BUY";
    if (exit.shouldExit && !entry.shouldEnter) return "SELL";

    // conflict or weak signals → stay flat
    return "HOLD";
}

function computeConfidence({ entry, exit, decision }) {
    if (decision === "BUY") return clamp(entry.composite, 0, 100);
    if (decision === "SELL") return clamp(exit.composite, 0, 100);

    // HOLD: confidence is inverse of max pressure
    const pressure = Math.max(entry.composite, exit.composite);
    return clamp(100 - pressure, 0, 100);
}

// -----------------------------
// REASONING BUILDER
// -----------------------------

function buildReasoning({ scores, entry, exit, decision }) {
    const parts = [];

    parts.push(
        `Momentum: ${scores.momentum.toFixed(1)}, ` +
        `Narrative: ${scores.narrative.toFixed(1)}, ` +
        `Volume: ${scores.volume.toFixed(1)}, ` +
        `Volatility: ${scores.volatility.toFixed(1)}, ` +
        `Funding: ${scores.funding.toFixed(1)}.`
    );

    parts.push(
        `Entry composite: ${entry.composite.toFixed(1)}, ` +
        `Exit composite: ${exit.composite.toFixed(1)}.`
    );

    if (decision === "BUY") {
        parts.push(
            "Conditions favor upside: momentum and narrative are aligned, " +
            "with supportive volume/volatility profile."
        );
    } else if (decision === "SELL") {
        parts.push(
            "Risk of downside or exhaustion: momentum is fading, " +
            "volume/narrative are weakening or funding is crowded."
        );
    } else {
        parts.push(
            "Signals are mixed or weak; staying flat is preferred until " +
            "a clearer imbalance emerges."
        );
    }

    return parts.join(" ");
}

// -----------------------------
// UTILS
// -----------------------------

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
