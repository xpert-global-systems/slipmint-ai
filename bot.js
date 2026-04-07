// telegram-bot/bot.js

import { ethers } from "ethers";
import axios from "axios";
import {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  GETBLOCK_RPC_URL,
  TARGET_WALLETS,
  MIN_ETH_ALERT,
} from "./config.js";

const POLL_INTERVAL_MS = 10_000;
const MAX_BLOCKS_PER_CYCLE = 25;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in config.js");
}

if (!TELEGRAM_CHAT_ID) {
  throw new Error("Missing TELEGRAM_CHAT_ID in config.js");
}

if (!GETBLOCK_RPC_URL) {
  throw new Error("Missing GETBLOCK_RPC_URL in config.js");
}

if (!Array.isArray(TARGET_WALLETS) || TARGET_WALLETS.length === 0) {
  throw new Error("TARGET_WALLETS must be a non-empty array in config.js");
}

if (typeof MIN_ETH_ALERT !== "number") {
  throw new Error("MIN_ETH_ALERT must be a number in config.js");
}

const provider = new ethers.JsonRpcProvider(GETBLOCK_RPC_URL);
const watchedWallets = new Set(
  TARGET_WALLETS.map((wallet) => wallet.toLowerCase())
);

let lastProcessedBlock = 0;
let isRunning = false;
const alertedTxHashes = new Set();

/**
 * Sends a plain text Telegram message.
 * @param {string} text
 * @returns {Promise<void>}
 */
async function sendMessage(text) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      },
      {
        timeout: 15000,
      }
    );
  } catch (error) {
    const details =
      error?.response?.data?.description ||
      error?.message ||
      "Unknown Telegram error";
    console.error("Failed to send Telegram message:", details);
  }
}

/**
 * Formats a whale alert message.
 * @param {object} tx
 * @param {string} ethValue
 * @param {number} blockNumber
 * @returns {string}
 */
function formatAlertMessage(tx, ethValue, blockNumber) {
  return [
    "🚨 Whale Alert",
    `Block: ${blockNumber}`,
    `From: ${tx.from}`,
    `To: ${tx.to}`,
    `Amount: ${ethValue} ETH`,
    `Tx Hash: ${tx.hash}`,
    `Etherscan: https://etherscan.io/tx/${tx.hash}`,
  ].join("\n");
}

/**
 * Checks whether a transaction matches our watched criteria.
 * @param {object} tx
 * @returns {boolean}
 */
function isMatchingTransaction(tx) {
  if (!tx?.from || !tx?.to || tx.value == null) {
    return false;
  }

  const sender = tx.from.toLowerCase();
  if (!watchedWallets.has(sender)) {
    return false;
  }

  const ethValue = Number(ethers.formatEther(tx.value));
  return ethValue >= MIN_ETH_ALERT;
}

/**
 * Processes a single block.
 * @param {number} blockNumber
 * @returns {Promise<void>}
 */
async function processBlock(blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber, true);

    if (!block || !Array.isArray(block.transactions)) {
      console.warn(`Block ${blockNumber} could not be loaded properly.`);
      return;
    }

    for (const tx of block.transactions) {
      if (!isMatchingTransaction(tx)) {
        continue;
      }

      if (alertedTxHashes.has(tx.hash)) {
        continue;
      }

      const ethValue = Number(ethers.formatEther(tx.value)).toFixed(4);
      const message = formatAlertMessage(tx, ethValue, blockNumber);

      console.log(message);
      await sendMessage(message);
      alertedTxHashes.add(tx.hash);
    }
  } catch (error) {
    console.error(`Error processing block ${blockNumber}:`, error.message);
  }
}

/**
 * Polls new blocks and processes them safely.
 * @returns {Promise<void>}
 */
async function checkTransactions() {
  if (isRunning) {
    console.warn("Previous cycle still running. Skipping this round.");
    return;
  }

  isRunning = true;

  try {
    const latestBlock = await provider.getBlockNumber();

    if (lastProcessedBlock === 0) {
      lastProcessedBlock = latestBlock;
      console.log(`Initialized at block ${latestBlock}`);
      return;
    }

    if (latestBlock <= lastProcessedBlock) {
      return;
    }

    let fromBlock = lastProcessedBlock + 1;
    let toBlock = latestBlock;

    if (toBlock - fromBlock + 1 > MAX_BLOCKS_PER_CYCLE) {
      toBlock = fromBlock + MAX_BLOCKS_PER_CYCLE - 1;
      console.warn(
        `Large block gap detected. Processing ${fromBlock} to ${toBlock} first.`
      );
    }

    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber += 1) {
      await processBlock(blockNumber);
      lastProcessedBlock = blockNumber;
    }
  } catch (error) {
    console.error("Error checking transactions:", error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the bot loop.
 */
async function startBot() {
  console.log("Telegram Smart Money Bot starting...");
  console.log(`Watching ${watchedWallets.size} wallet(s)`);
  console.log(`Minimum alert threshold: ${MIN_ETH_ALERT} ETH`);

  await sendMessage("🤖 Telegram Smart Money Bot is now running.");

  await checkTransactions();
  setInterval(checkTransactions, POLL_INTERVAL_MS);
}

startBot().catch((error) => {
  console.error("Fatal startup error:", error.message);
});
