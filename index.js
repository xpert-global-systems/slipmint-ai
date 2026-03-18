async function runStrategyCycle(agent) {
    console.log(`\n🔄 [SLIPMINT AI] Initiating Market Scan...`);

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

            // Dynamic sizing based on confidence
            let tradeSize = 1;
            if (signal.confidence >= 95) {
                tradeSize = 2;
                console.log(`📈 High confidence detected. Doubling position size to ${tradeSize}.`);
            }

            await tradingEngine.executeMarketOrder({
                contract: pair,
                direction: signal.action,
                size: tradeSize,
                leverage: config.trading.maxLeverage || 20
            });

            await sleep(2000);

        } catch (error) {
            console.error(`❌ [SCAN ERROR] Failed processing ${pair}:`, error.message);
        }
    }
}
