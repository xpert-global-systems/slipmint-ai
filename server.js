const express = require("express");
const cors = require("cors");

// Core SlipMint modules
const createMarketModule = require("./src/modules/market/market.service");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");
const createMomentumNarrativeAgent = require("./src/agents/momentumNarrativeAgent");

// Bootstrap core services
const marketService = createMarketModule();
const strategy = createMomentumNarrativeStrategy({ marketService });
const agent = createMomentumNarrativeAgent({ strategy });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    name: "SlipMint Auto-Trader API",
    status: "ok",
    version: "v1",
    endpoints: ["/signal"],
  });
});

// Main signal endpoint
app.get("/signal", async (req, res) => {
  try {
    const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();

    const signal = await agent.evaluate(symbol);

    const response = {
      symbol: signal.symbol || symbol,
      action: signal.action,          // "BUY" | "SELL" | "HOLD"
      confidence: signal.confidence,  // 0–100
      reasoning: signal.reasoning,
      raw: signal.raw || signal,      // full strategy payload
      generatedAt: signal.generatedAt || new Date().toISOString(),
    };

    res.json(response);
  } catch (err) {
    console.error("Error generating signal:", err);
    res.status(500).json({
      error: "Failed to generate signal",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`SlipMint Auto-Trader API running on port ${PORT}`);
});
