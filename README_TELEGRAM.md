# Telegram Smart Money Alerts Bot

This bot tracks Ethereum wallets and sends real-time alerts to Telegram when large ETH or token transactions occur.  
It is designed to integrate with the SlipMint AI ecosystem and runs in its own branch: `telegram-bot`.

---

## 🚀 Features

- Real-time Ethereum wallet tracking  
- Alerts for large ETH transactions (configurable minimum)  
- Supports multiple wallets  
- Easily extendable to token tracking  
- Fully integrated with SlipMint AI for advanced analytics and future AI-driven strategies  

---

## 🏗 Architecture Diagram

```mermaid
flowchart LR
    A[Ethereum Blockchain] -->|RPC calls| B[GetBlock RPC Node]
    B --> C[Telegram Bot NodeJS]
    C --> D[Telegram Users or Channel]
    C --> E[SlipMint AI Optional]
    E -->|Wallet and Market Analysis| C
