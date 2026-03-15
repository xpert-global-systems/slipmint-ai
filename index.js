const createMarketModule = require("./src/modules/market/market.service");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");
const createMomentumNarrativeAgent = require("./src/agents/momentumNarrativeAgent");

async function main() {
    const marketService = createMarketModule();
    const strategy = createMomentumNarrativeStrategy({ marketService });
    const agent = createMomentumNarrativeAgent({ strategy });

    const symbol = "BTCUSDT";
    const signal = await agent.evaluate(symbol);

    console.log("SlipMint Signal:", signal);
}

main();
