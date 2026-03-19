import 'dotenv/config';

// 1. THE "FAIL-FAST" SECURITY CHECK
// If your keys are missing, the bot refuses to start and alerts you immediately.
if (!process.env.GATE_API_KEY || !process.env.GATE_API_SECRET) {
  console.error('❌ [XPERT SYSTEM HALTED] CRITICAL ERROR: Gate.io API keys are missing from the .env file.');
  process.exit(1); // Kill the server before it makes a mistake
}

// 2. THE CONFIGURATION EXPORT
export const config = {
  gate: {
    apiKey: process.env.GATE_API_KEY,
    apiSecret: process.env.GATE_API_SECRET,
  },
  trading: {
    // Allows you to override the default coin from the .env file
    settle: process.env.DEFAULT_SETTLE || 'usdt',
    contract: process.env.DEFAULT_CONTRACT || 'BTC_USDT',
    
    // --- NEW: RISK MANAGEMENT PROTOCOLS ---
    // Protects your capital by setting hard limits, even if a bad signal comes in.
    maxLeverage: parseInt(process.env.MAX_LEVERAGE, 10) || 20,
    defaultTpPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT) || 5.0, // 5% Take Profit
    defaultSlPercent: parseFloat(process.env.STOP_LOSS_PERCENT) || 2.0,   // 2% Stop Loss
  },
  system: {
    // For routing success/failure messages back to your CryptoLite Discord
    discordWebhook: process.env.DISCORD_ALERTS_WEBHOOK || null, 
  }
};
