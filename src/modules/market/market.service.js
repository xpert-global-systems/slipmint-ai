import { fetchTokenPrice, fetchTokenMetadata } from "./market.fetcher.js";

export async function getMarketStatus() {
  const price = await fetchTokenPrice("bitcoin");
  const meta = await fetchTokenMetadata("bitcoin");

  return `
    Market module initialized.
    ${meta.name} (${meta.symbol.toUpperCase()})
    Rank: ${meta.market_cap_rank}
    Price: $${price.price}
  `;
}
