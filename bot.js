// telegram-bot/bot.js

import { ethers } from "ethers";
import axios from "axios";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GETBLOCK_RPC_URL, TARGET_WALLETS, MIN_ETH_ALERT } from "./config.js";

const provider = new ethers.JsonRpcProvider(GETBLOCK_RPC_URL);
let lastBlock = 0;

// Send message to Telegram
async function sendMessage(text) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
  });
}

// Check transactions
async function checkTransactions() {
  const blockNumber = await provider.getBlockNumber();

  if (lastBlock === 0) {
    lastBlock = blockNumber;
    return;
  }

  for (let i = lastBlock + 1; i <= blockNumber; i++) {
    const block = await provider.getBlock(i, true);

    for (const tx of block.transactions) {
      if (!tx.to) continue;

      if (TARGET_WALLETS.includes(tx.from.toLowerCase())) {
        const ethValue = ethers.formatEther(tx.value);

        if (parseFloat(ethValue) >= MIN_ETH_ALERT) {
          const message = `
🚨 Whale Alert
Wallet: ${tx.from}
Sent: ${ethValue} ETH
To: ${tx.to}
Tx: https://etherscan.io/tx/${tx.hash}
          `;
          console.log(message);
          await sendMessage(message);
        }
      }
    }
  }

  lastBlock = blockNumber;
}

// Run every 10 seconds
setInterval(checkTransactions, 10000);
console.log("Telegram Smart Money Bot running...");
