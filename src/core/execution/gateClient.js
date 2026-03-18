import GateApi from 'gate-api';
import { config } from '../../config/env.js';

class XpertTradingEngine {
  constructor() {
    // 1. Secure Initialization
    this.client = new GateApi.ApiClient();
    this.client.setApiKeySecret(config.gate.apiKey, config.gate.apiSecret);
    this.futuresApi = new GateApi.FuturesApi(this.client);
    this.settle = config.trading.settle || 'usdt'; // Defaults to USDT-M Futures
  }

  /**
   * Automatically sets the leverage for the specific pair before trading.
   * Prevents "Insufficient Margin" errors.
   */
  async setLeverage(contract, leverageX) {
    try {
      await this.futuresApi.updatePositionLeverage(this.settle, contract, leverageX);
      console.log(`⚙️ [SYSTEM] Leverage for ${contract} set to ${leverageX}x`);
    } catch (error) {
      console.error(`⚠️ [WARNING] Could not set leverage:`, error.response ? error.response.body : error.message);
    }
  }

  /**
   * Executes a VIP Signal instantly.
   * @param {Object} signal - { contract: "BTC_USDT", direction: "BUY", size: 100, leverage: 20 }
   */
  async executeMarketOrder(signal) {
    console.log(`🚀 [XPERT ENGINE] Executing ${signal.direction} on ${signal.contract}...`);

    try {
      // Step 1: Prep the battlefield (Set Leverage)
      await this.setLeverage(signal.contract, signal.leverage);

      // Step 2: Build the Order
      const order = new GateApi.FuturesOrder();
      order.contract = signal.contract;
      
      // Gate.io Logic: Positive size = Long/Buy, Negative size = Short/Sell
      order.size = signal.direction === 'BUY' ? signal.size : -Math.abs(signal.size);
      
      // 'ioc' (Immediate-Or-Cancel) with price '0' executes as a Market Order
      order.price = '0'; 
      order.tif = 'ioc'; 

      // Step 3: Fire the Order
      const response = await this.futuresApi.createFuturesOrder(this.settle, order);
      
      console.log(`✅ [TRADE OPENED] Order ID: ${response.body.id} | Status: ${response.body.status}`);
      return response.body;

    } catch (error) {
      console.error("❌ [TRADE FATAL ERROR]:", error.response ? error.response.body : error.message);
      // Optional: Send this error to your Discord admin channel so you know it failed
      throw error;
    }
  }
}

// Export a single instance to be used across your whole app
export const tradingEngine = new XpertTradingEngine();
