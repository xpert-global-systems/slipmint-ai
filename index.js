// Ensure you have these imports at the top of your index.js:
// import { discordBroadcaster } from "./src/core/notifications/discordBroadcaster.js";
// import createRiskEngine from "./src/core/risk/riskEngine.js";
// import { monitorPosition } from "./src/core/execution/autoCloseEngine.js";

const riskEngine = createRiskEngine();

async function runStrategyCycle(agent, marketService) { 
    console.log(`\n🔄 [SLIPMINT AI] Initiating Market Scan...`);

    // --- PHASE 1: SCAN & EXECUTE ---
    for (const pair of WATCHLIST) {
        try {
            console.log(`\n📊 Analyzing ${pair}...`);
            const signal = await agent.evaluate(pair);

            if (!signal || signal.action === "HOLD") {
                console.log(`⏸️ [${pair}] Holding. Reason: ${signal?.reason || "No strong momentum narrative."}`);
                continue;
            }

            console.log(`🔥 [${pair}] VIP SETUP DETECTED! Action: ${signal.action} | Confidence: ${signal.confidence}%`);
            console.log(`📐 Indicators:`, signal.indicators);

            // 1. Fetch current price
            const context = await marketService.getTicker(pair);
            const currentPrice = parseFloat(context.last);

            // 2. Dynamic position sizing
            const tradeSize = riskEngine.calculatePositionSize(
                1000, 
                currentPrice, 
                signal.confidence
            );

            // 3. Dynamic SL/TP
            const targets = riskEngine.calculateTargets(
                currentPrice, 
                signal.action, 
                5
            );

            // 4. Execute trade
            await tradingEngine.executeMarketOrder({
                contract: pair,
                direction: signal.action,
                size: tradeSize,
                leverage: config.trading.maxLeverage || 20
            });

            // 5. Discord broadcast
            await discordBroadcaster.sendSignalAlert({
                pair: pair,
                action: signal.action,
                price: currentPrice,
                sl: targets.stopLoss,
                tp: targets.takeProfit,
                reason: signal.reason
            });

            await sleep(2000);

        } catch (error) {
            console.error(`❌ [SCAN ERROR] Failed processing ${pair}:`, error.message);
        }
    }

    // --- PHASE 2: MONITOR & PROTECT ---
    console.log(`\n🛡️ [SLIPMINT AI] Running Position Monitor...`);
    for (const pair of WATCHLIST) {
        try {
            await monitorPosition(pair);
        } catch (error) {
            console.error(`❌ [MONITOR ERROR] Failed checking position for ${pair}:`, error.message);
        }
    }
}
