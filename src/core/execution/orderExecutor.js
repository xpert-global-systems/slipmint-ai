import { futuresApi } from './gateClient.js';
import { config } from '../../config/env.js';

/**
 * XPERT ADVANCED MARKET EXECUTION
 * Upgraded with Crash Protection and Dynamic Asset Routing
 */
export async function placeMarketOrder({ contract, side, size }) {
  // 1. Directional Math (Gate.io requires positive for Long, negative for Short)
  const signedSize = side === 'LONG' || side === 'BUY' ? Math.abs(size) : -Math.abs(size);
  
  // 2. Dynamic Routing (Allows the bot to trade any pair sent from the signal)
  const tradeContract = contract || config.trading.contract; 

  console.log(`🚀 [XPERT EXECUTION] Initiating ${side} on ${tradeContract} (Size: ${signedSize})...`);

  try {
    // 3. Fire the Market Order
    const response = await futuresApi.createFuturesOrder(config.trading.settle, {
      contract: tradeContract,
      size: signedSize,
      price: '0', 
      tif: 'ioc',
    });

    console.log(`✅ [TRADE FILLED] ID: ${response.body.id} | Status: ${response.body.status}`);
    return response.body;

  } catch (error) {
    // 4. Crash Protection (Catches the error without killing the server)
    const errorMsg = error.response ? JSON.stringify(error.response.body) : error.message;
    console.error(`❌ [XPERT FATAL ERROR] Trade Failed on ${tradeContract}:`, errorMsg);

    // TODO: Add Discord Webhook here to alert your phone if a trade fails
    
    throw error; // Safely bubble the error up
  }
}
