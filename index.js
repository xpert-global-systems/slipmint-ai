// index.js

const createMarketModule = require("./src/market/marketService");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");

async function main() {
    // Initialize market module
    const marketService = createMarketModule();

    // Register strategy
    const momentumNarrative = createMomentumNarrativeStrategy({ marketService });

    // Example: run strategy for BTC
    const result = await momentumNarrative.run("BTCUSDT");

    console.log("SlipMint Strategy Output:");
    console.log(JSON.stringify(result, null, 2));
}

main();
