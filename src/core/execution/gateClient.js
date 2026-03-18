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
}

export const tradingEngine = new XpertTradingEngine();
