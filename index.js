const createMarketModule = require("./src/modules/market/market.service");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");
const createMomentumNarrativeAgent = require("./src/agents/momentumNarrativeAgent");

async function main() {
    const marketService = createMarketModule();
    const strategy = createMomentumNarrativeStrategy({ marketService });
    const agent = createMomentumNarrativeAgent({ strategy });

    const signal = await agent.evaluate("BTCUSDT");

    console.log("SlipMint Agent Signal:");
    console.log(JSON.stringify(signal, null, 2));
}

main();
