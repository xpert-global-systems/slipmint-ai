// telegram-bot/config.js

// =========================
// TELEGRAM SETTINGS
// =========================
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "PASTE_YOUR_BOT_TOKEN";
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "PASTE_YOUR_CHAT_ID";

// =========================
// ETHEREUM RPC
// =========================
export const GETBLOCK_RPC_URL =
  process.env.GETBLOCK_RPC_URL || "https://eth.getblock.io/YOUR_API_KEY";

// =========================
// WALLET TRACKING
// =========================

// Always use lowercase addresses
export const TARGET_WALLETS = [
  "0xwallet1".toLowerCase(),
  "0xwallet2".toLowerCase(),
];

// Minimum ETH amount to trigger alert
export const MIN_ETH_ALERT = Number(process.env.MIN_ETH_ALERT) || 1;

// =========================
// GATE.IO API (NEW 🔥)
// =========================
export const GATE_API_KEY = process.env.GATE_API_KEY || "";
export const GATE_API_SECRET = process.env.GATE_API_SECRET || "";

// Enable/disable Gate integration
export const ENABLE_GATE = GATE_API_KEY !== "" && GATE_API_SECRET !== "";
