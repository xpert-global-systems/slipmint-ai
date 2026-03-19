import GateApi from 'gate-api';
import { config } from '../../config/env.js';
import { sendDiscordAlert } from '../alerts/discord.js';

class XpertTradingEngine {
  constructor() {
    this.client = new GateApi.ApiClient();

    // IMPORTANT: Gate.io requires API KEY + SECRET + PASSPHRASE
    this.client.setApiKeySecret(
      config.gate.apiKey,
      config.gate.apiSecret,
      config.gate.passphrase
    );

    this.futuresApi = new GateApi.FuturesApi(this.client);
    this.settle = config.trading.settle || 'usdt';
  }

  // -----------------------------
  // SET LEVERAGE
  // -----------------------------
  async setLeverage(contract, leverageX) {
    try {
      await this.futuresApi.updatePositionLeverage(
        this.settle,
        contract,
        { leverage: leverageX }
      );

      console.log(`⚙️ [SYSTEM] Leverage for ${contract} set to ${leverageX}x`);
    } catch (error) {
      const err = error.response ? error.response.body : error.message;
      console.error(`⚠️ [WARNING] Could not set leverage:`, err);

      await sendDiscordAlert(
        `⚠️ **LEVERAGE ERROR**  
Contract: ${contract}  
Error: ${JSON.stringify(err)}`
      );
    }
  }

  // -----------------------------
  // EXECUTE MARKET ORDER
  // -----------------------------
  async executeMarketOrder(signal) {
    console.log(`🚀 [XPERT ENGINE] Executing ${signal.direction} on ${signal.contract}...`);

    try {
      // Set leverage first
      await this.setLeverage(signal.contract, signal.leverage);

      const order = new GateApi.FuturesOrder();
      order.contract = signal.contract;
      order.size = signal.direction === 'BUY'
        ? signal.size
        : -Math.abs(signal.size);

      order.price = '0'; // Market order
      order.tif = 'ioc'; // Immediate or cancel

      const response = await this.futuresApi.createFuturesOrder(
        this.settle,
        order
      );

      console.log(
        `✅ [TRADE OPENED] Order ID: ${response.body.id} | Status: ${response.body.status}`
      );

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
      const err = error.response ? error.response.body : error.message;

      console.error("❌ [TRADE FATAL ERROR]:", err);

      await sendDiscordAlert(
        `❌ **TRADE ERROR**  
Pair: ${signal.contract}  
Error: ${JSON.stringify(err)}`
      );

      throw error;
    }
  }

  // -----------------------------
  // GET OPEN POSITION
  // -----------------------------
  async getPosition(contract) {
    try {
      const res = await this.futuresApi.getPosition(this.settle, contract);
      return res.body;
    } catch (err) {
      const e = err.response ? err.response.body : err.message;
      console.error(`❌ [POSITION ERROR]`, e);
      return null;
    }
  }

  // -----------------------------
  // CLOSE POSITION AT MARKET
  // -----------------------------
  async closePosition(contract) {
    try {
      const pos = await this.getPosition(contract);
      if (!pos || pos.size === 0) return null;

      const order = new GateApi.FuturesOrder();
      order.contract = contract;
      order.size = pos.size > 0 ? -pos.size : Math.abs(pos.size);
      order.price = '0';
      order.tif = 'ioc';

      const res = await this.futuresApi.createFuturesOrder(
        this.settle,
        order
      );

      console.log(`🔻 [POSITION CLOSED] ${contract} | Order ID: ${res.body.id}`);

      await sendDiscordAlert(
        `🔻 **POSITION CLOSED**  
Contract: ${contract}  
Size Closed: ${pos.size}  
Order ID: ${res.body.id}`
      );

      return res.body;

    } catch (err) {
      const e = err.response ? err.response.body : err.message;

      console.error(`❌ [CLOSE ERROR]`, e);

      await sendDiscordAlert(
        `❌ **CLOSE POSITION ERROR**  
Contract: ${contract}  
Error: ${JSON.stringify(e)}`
      );

      return null;
    }
  }
}

export const tradingEngine = new XpertTradingEngine();
