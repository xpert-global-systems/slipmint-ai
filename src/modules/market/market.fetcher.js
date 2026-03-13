export async function fetchTokenPrice(symbol = "bitcoin") {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );

    const data = await response.json();

    return {
      symbol,
      price: data[symbol]?.usd || null,
      message: "Real price fetched successfully"
    };
  } catch (error) {
    return {
      symbol,
      price: null,
      message: "Error fetching price: " + error.message
    };
  }
}
