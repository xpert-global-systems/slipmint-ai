import { fetchMarketData } from "./market.fetcher.js";

export function getMarketStatus() {
  const data = fetchMarketData();
  return `Market module initialized. Fetcher status: ${data.message}`;
}
