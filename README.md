# CryptoLink Docs

## Overview

CryptoLink is a lightweight crypto market analytics platform that has evolved from a simple pricing API into a broader signal-driven system.

At its current **v3.0** stage, CryptoLink includes:

- direct market data
- derived technical signals
- interpretive market layers
- frontend analytical panels
- conversational analytics through Nexus MCP

This documentation is intended to reflect the **current state of the platform** and serve as the base reference for the next evolution phase.

---

## Current Product Scope

CryptoLink currently operates across three functional layers:

### Direct Data
Raw or near-raw market information:
- `price`
- `prices`
- `snapshot`
- `spark/history`

### Derived Signals
Signals computed from internal market data:
- `trends`
- `movers`
- `momentum`
- `regime`
- `market-health`

### Interpretive Signals
Signals focused on alerts, conditions, and exceptions:
- `risk-flags`
- `anomalies`

---

## Current Endpoints

### Direct
- `GET /v1/price`
- `GET /v1/prices`
- `GET /v1/snapshot`

### Derived
- `GET /v1/trends`
- `GET /v1/movers`
- `GET /v1/momentum`
- `GET /v1/regime`
- `GET /v1/market-health`

### Interpretive
- `GET /v1/risk-flags`
- `GET /v1/anomalies`

---

## Frontend Panels

CryptoLink frontend currently includes:

### Market Regime
Aggregate market state with:
- regime state
- confidence
- composite score
- market health
- orb-based visual identity

### Momentum
Recent movement strength and consistency.

### Trends
Recent market direction and derived signal read.

### Signals Radar
Multidimensional view across:
- Trends
- Momentum
- Movers
- Regime

### Compare
Relative performance comparison across selected assets.

### Trend Pulse
Composite trend signal over time.

---

## Persistence

CryptoLink frontend uses persisted state for selected analytical panels.

Currently persisted:
- trends
- momentum
- regime
- signals radar
- trend pulse history
- compare configuration

This helps reduce visual reset and improves continuity across sections and refreshes.

---

## Nexus MCP Integration

CryptoLink is also exposed through Nexus MCP as a structured conversational analytics layer.

### Active MCP capabilities
- snapshot
- prices
- trends
- movers
- momentum
- regime
- risk flags
- anomalies
- market health

### Structured rendering
Nexus MCP uses sections such as:
- `notice`
- `kpi_grid`
- `text`
- `sparkline`

This turns Nexus into a conversational analytics console for CryptoLink.

---

## Language Direction

CryptoLink currently uses **English-first UI and naming**.

This aligns with:
- crypto market norms
- analytics tooling language
- future international positioning

A language toggle may be added later in Settings.

---

## Freeze Notes

The current v3.0 freeze considers the following components stable enough to treat as baseline:

- Regime orb hero
- Market Health integration
- Signals Radar
- Compare V2
- Momentum cards
- Trends cards
- English naming consistency
- live/restored/refreshing states
- persisted analytical UI state

---

## Next Direction

The next likely expansion area is not more of the same technical panels, but a new complementary intelligence layer such as:

- **Social Pulse**
- **Live Narrative**
- real-time social/news signals

This will likely justify a future front-end reorganization rather than overloading the current Trends section.

---

## Recommended Reading

For a more complete technical snapshot of the current platform state, see:

- `cryptolink-v3.0-current-state.md`

This README is intended as the short entry point.  
The full current-state document captures the freeze in more detail.
