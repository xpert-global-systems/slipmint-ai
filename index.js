const createMarketModule = require("./src/modules/market/market.service");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");

async function main() {
    // Initialize REAL market module
    const marketService = createMarketModule();

    // Register strategy
    const momentumNarrative = createMomentumNarrativeStrategy({ marketService });

    // Run strategy for BTC
    const result = await momentumNarrative.run("BTCUSDT");

    console.log("SlipMint Strategy Output:");
    console.log(JSON.stringify(result, null, 2));
}

main();
