import { tradingEngine } from "./src/core/execution/gateClient.js";
import { config } from "./src/config/env.js";
import createMomentumNarrativeAgent from "./src/core/narrative/momentumNarrativeAgent.js";
import createMarketData from "./src/core/data/marketData.js";

// --- DEEP STRATEGY CONFIGURATION ---
// 1. Scan multiple high-volume assets, not just one.
const WATCHLIST = ["BTC_USDT", "ETH_USDT", "SOL_USDT", "XAU_USDT"]; 

// 2. Scan Frequency (e.g., Every 15 minutes)
const SCAN_INTERVAL_MS = 15 * 60 * 1000; 

// 3. The "Sniper" Filter: Minimum AI Confidence Score to take a trade
const MIN_CONFIDENCE = 80; 

// Utility to prevent API rate-limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runStrategyCycle(agent) {
    console.log(`\n🔄 [SLIPMINT AI] Initiating Market Scan...`);

    for (const pair of WATCHLIST) {
        try {
            console.log(`\n📊 Analyzing ${pair}...`);
            const signal = await agent.evaluate(pair);

            // 1. Skip if the AI says to wait
            if (!signal || signal.action === "HOLD") {
                console.log(`⏸️ [${pair}] Holding. No strong momentum narrative.`);
                continue;
            }

            // 2. DEEP STRATEGY: The Confidence Gate
            // If the AI says "BUY" but is only 60% sure, we skip it to protect capital.
            if (signal.confidence < MIN_CONFIDENCE) {
                console.log(`⚠️ [${pair}] Signal: ${signal.action}, but confidence (${signal.confidence}%) is too low. Skipping trade.`);
                continue;
            }

            console.log(`🔥 [${pair}] VIP SETUP DETECTED! Action: ${signal.action} | Confidence: ${signal.confidence}%`);

            // 3. DEEP STRATEGY: Dynamic Sizing
            // Double the trade size if the AI is 95%+ confident
            let tradeSize = 1; // Base size
            if (signal.confidence >= 95) {
                tradeSize = tradeSize * 2;
                console.log(`📈 High confidence detected. Doubling position size to ${tradeSize}.`);
            }

            // 4. Execute the Trade
            await tradingEngine.executeMarketOrder({
                contract: pair,
                direction: signal.action,
                size: tradeSize,
                leverage: config.trading.maxLeverage || 20
            });

            // Rest for 2 seconds before checking the next coin so Gate.io doesn't block you
            await sleep(2000); 

        } catch (error) {
            console.error(`❌ [SCAN ERROR] Failed processing ${pair}:`, error.message);
            // We catch the error so the bot doesn't crash. It will just move to the next coin.
        }
    }
}

async function bootSystem() {
    console.log("🚀 [XPERT GLOBAL SYSTEMS] Booting SlipMint AI Core...");

    // Initialize modules once
    const marketService = createMarketData();
    const agent = createMomentumNarrativeAgent({ marketService });

    // The "Always On" Infinite Loop
    while (true) {
        await runStrategyCycle(agent);
        
        console.log(`\n💤 [SLIPMINT AI] Scan complete. Sleeping for ${SCAN_INTERVAL_MS / 60000} minutes...`);
        await sleep(SCAN_INTERVAL_MS);
    }
}

// Start the engine
bootSystem();
