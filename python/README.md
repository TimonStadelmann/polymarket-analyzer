# Polymarket Data Collection Scripts

Python scripts to fetch data from Polymarket APIs and import into Neo4j.

**Data Source**: [Polymarket](https://polymarket.com/) - World's largest prediction market platform

- **Gamma API**: https://gamma-api.polymarket.com/ (Events, Markets, Outcomes)
- **Data API**: https://data-api.polymarket.com/ (Trades, User Profiles)

## Prerequisites

```bash
pip install neo4j requests tqdm
```

## Environment Setup

Set Neo4j credentials (Google Colab or terminal):

```python
# Google Colab
from google.colab import userdata
NEO4J_URI = userdata.get('NEO4J_URI')
NEO4J_USER = userdata.get('NEO4J_USER')
NEO4J_PASSWORD = userdata.get('NEO4J_PASSWORD')
```

```bash
# Terminal
export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"
```

## Scripts (Run in Order)

### step-1.py - Install Packages

Installs required Python libraries (neo4j, requests, tqdm)

### step-2.py - Initialize

Loads environment variables and initializes API clients

### step-3.py - Test Connections

Verifies Neo4j and Polymarket API connectivity

### step-4.py - Fetch Events

Fetches **150 closed events** from Polymarket Gamma API

- Output: `latest_events` array (150 events)

### step-5.py - Extract Outcomes

Parses market outcomes and extracts condition IDs

- Output: `all_outcomes` list, `all_condition_ids` set

### step-6.py - Fetch Trades

Fetches **ALL trades** for each market with pagination from Polymarket Data API

- **Strategy**: Per-market fetching (2,000 trade limit per market)
- **Pagination**: Continues until no more trades returned
- **Progress**: tqdm progress bars show real-time status
- Output: `all_token_transfers` (~18,000 trades)

### step-8.py - Import to Neo4j

Imports all data into Neo4j with batch processing

- Prepares wallet data (contracts + users from trades)
- Creates schema (constraints & indexes)
- Imports: Events, Markets, Outcomes, Users, Trades
- Creates relationships
- Uses `UNWIND` for performance
- Duration: ~2-5 minutes

### step-9.py - Verify Database

Runs integrity checks and displays statistics

## Data Coverage

- **Events**: 150 closed events
- **Markets**: ~300-400 markets (2-3 per event)
- **Trades**: ~18,000 trades (complete history per market)
- **Users**: ~7,000 unique traders
- **Volume**: $13M+ USDC
- **Time Range**: Last 3-6 months of resolved markets

## Key Design Decisions

### 1. Per-Market Fetching

**Decision**: Fetch trades individually per market (2,000 limit each)
**Rationale**: Ensures fair distribution; prevents active markets from dominating dataset

### 2. Pagination Implementation

**Decision**: Continue fetching until API returns < 500 trades
**Rationale**: Polymarket API hard limit is 500 per request; need multiple requests for complete history

### 3. Progress Bars

**Decision**: tqdm for real-time progress display
**Rationale**: Long-running fetches (5-15 min); users need feedback

### 4. Batch Imports

**Decision**: Neo4j UNWIND for batch processing (500 trades/batch)
**Rationale**: 50x faster than individual imports; reduces database round-trips

## Example Usage

```python
# Google Colab - Run all steps
%run step-1.py
%run step-2.py
%run step-3.py
%run step-4.py
%run step-5.py
%run step-6.py
%run step-8.py
%run step-9.py
```

## Performance Notes

- **step-6** (trades): ~5-15 minutes with pagination
- **step-8** (import): ~2-5 minutes with batch processing
- **Total pipeline**: ~10-20 minutes

## Data Source Citation

**Polymarket** (2025). _Prediction Market Platform_.

- Website: https://polymarket.com/
- Gamma API: https://gamma-api.polymarket.com/
- Data API: https://data-api.polymarket.com/
- Accessed: December 2025

All data is sourced from Polymarket's public APIs. The application analyzes historical trading data from resolved prediction markets.
