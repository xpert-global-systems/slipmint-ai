import { fetchTokenPrice } from "./market.fetcher.js";

export async function getMarketStatus() {
  const btc = await fetchTokenPrice("bitcoin");

  return `Market module initialized. BTC price: $${btc.price}`;
}
