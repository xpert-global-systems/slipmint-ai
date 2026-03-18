import GateApi from 'gate-api';
import { config } from '../../config/env.js';
import { sendDiscordAlert } from '../alerts/discord.js';

class XpertTradingEngine {
  constructor() {
    this.client = new GateApi.ApiClient();
    this.client.setApiKeySecret(config.gate.apiKey, config.gate.apiSecret);
    this.futuresApi = new GateApi.FuturesApi(this.client);
    this.settle = config.trading.settle || 'usdt';
  }

  async setLeverage(contract, leverageX) {
    try {
      await this.futuresApi.updatePositionLeverage(this.settle, contract, leverageX);
      console.log(`⚙️ [SYSTEM] Leverage for ${contract} set to ${leverageX}x`);
    } catch (error) {
      console.error(`⚠️ [WARNING] Could not set leverage:`, error.response ? error.response.body : error.message);

      await sendDiscordAlert(
        `⚠️ **LEVERAGE ERROR**  
Contract: ${contract}  
Error: ${error.response ? JSON.stringify(error.response.body) : error.message}`
      );
    }
  }

  async executeMarketOrder(signal) {
    console.log(`🚀 [XPERT ENGINE] Executing ${signal.direction} on ${signal.contract}...`);

    try {
      await this.setLeverage(signal.contract, signal.leverage);

      const order = new GateApi.FuturesOrder();
      order.contract = signal.contract;
      order.size = signal.direction === 'BUY' ? signal.size : -Math.abs(signal.size);
      order.price = '0';
      order.tif = 'ioc';

      const response = await this.futuresApi.createFuturesOrder(this.settle, order);

      console.log(`✅ [TRADE OPENED] Order ID: ${response.body.id} | Status: ${response.body.status}`);

      await sendDiscordAlert(
        `🚀 **TRADE EXECUTED**  
**Pair:** ${signal.contract}  
**Direction:** ${signal.direction}  
**Size:** ${signal.size}  
**Leverage:** ${signal.leverage}x  
**Order ID:** ${response.body.id}`
      );

      return response.body;

    } catch (error) {
      console.error("❌ [TRADE FATAL ERROR]:", error.response ? error.response.body : error.message);

      await sendDiscordAlert(
        `❌ **TRADE ERROR**  
Pair: ${signal.contract}  
Error: ${error.response ? JSON.stringify(error.response.body) : error.message}`
      );

      throw error;
    }
  }

  // NEW: Fetch open position
  async getPosition(contract) {
    try {
      const res = await this.futuresApi.getPosition(this.settle, contract);
      return res.body;
    } catch (err) {
      console.error(`❌ [POSITION ERROR]`, err.response ? err.response.body : err.message);
      return null;
    }
  }

  // NEW: Close position at market
  async closePosition(contract) {
    try {
      const pos = await this.getPosition(contract);
      if (!pos || pos.size === 0) return null;

      const order = new GateApi.FuturesOrder();
      order.contract = contract;
      order.size = pos.size > 0 ? -pos.size : Math.abs(pos.size);
      order.price = '0';
      order.tif = 'ioc';

      const res = await this.futuresApi.createFuturesOrder(this.settle, order);

      console.log(`🔻 [POSITION CLOSED] ${contract} | Order ID: ${res.body.id}`);

      await sendDiscordAlert(
        `🔻 **POSITION CLOSED**  
Contract: ${contract}  
Size Closed: ${pos.size}  
Order ID: ${res.body.id}`
      );

      return res.body;

    } catch (err) {
      console.error(`❌ [CLOSE ERROR]`, err.response ? err.response.body : err.message);

      await sendDiscordAlert(
        `❌ **CLOSE POSITION ERROR**  
Contract: ${contract}  
Error: ${err.response ? JSON.stringify(err.response.body) : err.message}`
      );

      return null;
    }
  }
}

export const tradingEngine = new XpertTradingEngine();
