import { tradingEngine } from "./gateClient.js";
import { sendDiscordAlert } from "../alerts/discord.js";
import createRiskEngine from "../risk/riskEngine.js";

const riskEngine = createRiskEngine();

/**
 * Auto-Close Engine
 * -----------------
 * Monitors open positions and automatically closes them
 * when dynamic SL/TP levels are hit.
 */
export async function monitorPosition(contract) {
    try {
        const pos = await tradingEngine.getPosition(contract);
        if (!pos || pos.size === 0) return;

        const entry = parseFloat(pos.entry_price);
        const size = pos.size;
        const side = size > 0 ? "BUY" : "SELL";
        const current = parseFloat(pos.mark_price);

        // Placeholder volatility index (you can replace with real data later)
        const volatilityIndex = 5;

        // Dynamic SL/TP from your risk engine
        const { stopLoss, takeProfit } = riskEngine.calculateTargets(
            entry,
            side,
            volatilityIndex
        );

        // BUY (LONG) logic
        if (side === "BUY") {
            if (current <= stopLoss) {
                await tradingEngine.closePosition(contract);
                await sendDiscordAlert(
                    `🛑 **STOP LOSS HIT**  
**Contract:** ${contract}  
**Entry:** ${entry}  
**SL:** ${stopLoss}  
**Current:** ${current}`
                );
                return;
            }

            if (current >= takeProfit) {
                await tradingEngine.closePosition(contract);
                await sendDiscordAlert(
                    `🎯 **TAKE PROFIT HIT**  
**Contract:** ${contract}  
**Entry:** ${entry}  
**TP:** ${takeProfit}  
**Current:** ${current}`
                );
                return;
            }
        }

        // SELL (SHORT) logic
        if (side === "SELL") {
            if (current >= stopLoss) {
                await tradingEngine.closePosition(contract);
                await sendDiscordAlert(
                    `🛑 **STOP LOSS HIT**  
**Contract:** ${contract}  
**Entry:** ${entry}  
**SL:** ${stopLoss}  
**Current:** ${current}`
                );
                return;
            }

            if (current <= takeProfit) {
                await tradingEngine.closePosition(contract);
                await sendDiscordAlert(
                    `🎯 **TAKE PROFIT HIT**  
**Contract:** ${contract}  
**Entry:** ${entry}  
**TP:** ${takeProfit}  
**Current:** ${current}`
                );
                return;
            }
        }

    } catch (err) {
        console.error(`❌ [AUTO-CLOSE ERROR]`, err.message);

        await sendDiscordAlert(
            `❌ **AUTO-CLOSE ENGINE ERROR**  
Contract: ${contract}  
Error: ${err.message}`
        );
    }
}
