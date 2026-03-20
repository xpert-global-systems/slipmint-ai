const express = require("express");
const cors = require("cors");
const client = require("prom-client"); // Prometheus client for metrics
const winston = require("winston");   // Winston for logging

// Core SlipMint modules
const createMarketModule = require("./src/modules/market/market.service");
const createMomentumNarrativeStrategy = require("./src/strategies/momentumNarrative");
const createMomentumNarrativeAgent = require("./src/agents/momentumNarrativeAgent");

// Create logging instance with Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

// Bootstrap core services
const marketService = createMarketModule();
const strategy = createMomentumNarrativeStrategy({ marketService });
const agent = createMomentumNarrativeAgent({ strategy });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure Prometheus metrics
const register = new client.Registry();

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});
const requestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Counts the total number of HTTP requests",
  labelNames: ["method", "status_code"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(requestCounter);

// Metrics endpoint for Prometheus scraping
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Middleware to record metrics for HTTP requests
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    route: req.path,
  });

  res.on("finish", () => {
    end({ status_code: res.statusCode });
    requestCounter.inc({
      method: req.method,
      status_code: res.statusCode,
    });
  });

  next();
});

// Health check
app.get("/", (req, res) => {
  logger.info("Health check endpoint accessed.");
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
    logger.info(`Signal requested for symbol: ${symbol}`);

    const signal = await agent.evaluate(symbol);

    const response = {
      symbol: signal.symbol || symbol,
      action: signal.action,          // "BUY" | "SELL" | "HOLD"
      confidence: signal.confidence,  // 0–100
      reasoning: signal.reasoning,
      raw: signal.raw || signal,      // full strategy payload
      generatedAt: signal.generatedAt || new Date().toISOString(),
    };

    logger.info(`Signal generated successfully: ${JSON.stringify(response)}`);
    res.json(response);
  } catch (err) {
    logger.error("Error generating signal:", err);
    res.status(500).json({
      error: "Failed to generate signal",
      details: err.message,
    });
  }
});

// Error-handling middleware for uncaught errors
app.use((err, req, res, next) => {
  logger.error("Unhandled error caught: ", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`SlipMint Auto-Trader API running on port ${PORT}`);
});
