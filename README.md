# slipmint-ai

AI intelligence layer for the SlipMint ecosystem. Provides market data, strategy engine, agent logic, wallet intelligence, and APIs for SlipMint Portal and XPERTPay. This repo is isolated to the xpert-global-systems organization and must not link to external or legacy repos.

---

## Architecture Diagram

```mermaid
flowchart TD

A[Presentation Layer\nserver.js • index.js • API Routes] --> B
B[Application Layer\nEngines Orchestrating System Flow] --> C
C[Domain Layer\nStrategies and Narrative Logic] --> D
D[Data Layer\nMarket Fetching • Market Data • Gate Client] --> E
E[Infrastructure Layer\nDocker • Prometheus • Logger • Tests]

subgraph Engines
    SE[signalEngine.js]
    IE[indicatorEngine.js]
    RE[riskEngine.js]
    ACE[autoCloseEngine.js]
    OE[orderExecutor.js]
    NA[momentumNarrativeAgent.js]
end

B --> SE
B --> IE
B --> RE
B --> ACE
B --> OE
B --> NA

subgraph Strategies
    MN[momentumNarrative.js]
end

C --> MN

subgraph Data
    MF[market.fetcher.js]
    MD[marketData.js]
    GC[gateClient.js]
    UT[utils]
end

D --> MF
D --> MD
D --> GC
D --> UT

subgraph Infra
    DC[docker-compose.yml]
    PM[prometheus.yml]
    LG[logger.js]
    TS[tests]
end

E --> DC
E --> PM
E --> LG
E --> TS
