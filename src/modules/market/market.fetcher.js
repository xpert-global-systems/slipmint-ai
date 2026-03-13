export async function fetchTokenMetadata(symbol = "bitcoin") {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${symbol}`
    );

    const data = await response.json();

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      market_cap_rank: data.market_cap_rank,
      image: data.image?.thumb,
      market_cap: data.market_data?.market_cap?.usd,
      message: "Metadata fetched successfully"
    };
  } catch (error) {
    return {
      id: symbol,
      symbol,
      name: null,
      market_cap_rank: null,
      image: null,
      market_cap: null,
      message: "Error fetching metadata: " + error.message
    };
  }
}
