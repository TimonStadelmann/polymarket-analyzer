# Polymarket Contrarian Finder

A full-stack TypeScript application for discovering contrarian trading opportunities on Polymarket using Neo4j graph database analysis.

## Overview

This application analyzes Polymarket prediction market data to identify traders who bought winning outcomes at very low prices, demonstrating successful contrarian strategies. It features interactive filters, trader profiles, statistical analysis, and network visualizations.

**Data Source**: All market and trading data is sourced from [Polymarket](https://polymarket.com/), the world's largest prediction market platform, via their public APIs (Gamma API and Data API).

## Project Goals & Domain

### Domäne: Polymarket Prediction Markets

**Polymarket** is a decentralized prediction market platform where users trade on the outcomes of real-world events. Participants buy and sell shares representing different outcomes (e.g., "Yes" or "No" for binary markets). Share prices (0-100%) reflect the market's collective probability estimate for each outcome. When events resolve, winning shares pay out $1.00, while losing shares become worthless.

**Key characteristics**:

- **Market Efficiency**: Prices should theoretically reflect true probabilities based on crowd wisdom
- **Contrarian Opportunities**: Markets can misprice events, creating profit opportunities for informed traders
- **Graph Structure**: Natural network relationships between traders, markets, events, and outcomes
- **On-chain Data**: All trades are recorded on the Polygon blockchain with complete transparency

### Zielsetzung: Finding Contrarian Trading Success

This project aims to:

1. **Identify Successful Contrarian Trades**: Find instances where traders bought winning outcomes at very low prices (< 20%), demonstrating conviction when the market was pessimistic
2. **Analyze Trading Patterns**: Use graph database queries to discover relationships between traders, markets, and categories
3. **Provide Interactive Analysis Tools**: Enable users to filter, explore, and visualize contrarian trading success through a modern web interface
4. **Demonstrate Graph Database Value**: Showcase how Neo4j's relationship-first approach naturally models prediction market dynamics better than traditional relational databases

**Why it matters**: Understanding contrarian success helps identify market inefficiencies, recognize skilled traders, and analyze how prediction markets evolve over time. The graph structure reveals hidden patterns like trader communities, correlated markets, and category flow trends.

## Features

### Core Analysis

- **Contrarian Leaderboard**: Top trades ranked by ROI with dynamic filters (category, price, ROI threshold)
- **Category Statistics**: Success rate analysis by market category
- **Top Traders**: Leaderboard of most successful contrarian traders
- **Database Health Monitor**: Real-time Neo4j statistics display

### Visualizations

- **Trader Network**: Network graph showing trader connections via shared markets
- **Market Correlation**: Markets connected by common trader interest
- **Category Flow**: Trader transitions between market categories over time

### Technical Features

- Real-time query execution with parameters
- Interactive React frontend with routing
- RESTful API with Fastify backend
- Optimized Neo4j queries (< 100ms)
- Comprehensive error handling

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + React Router + Tailwind CSS
- **Backend**: Fastify + TypeScript + Neo4j Driver
- **Database**: Neo4j AuraDB (Cloud)
- **Data Collection**: Python scripts with Neo4j, requests, tqdm
- **Architecture**: npm workspaces monorepo

## Project Structure

```
polymarket/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── services/neo4j.service.ts  # 9 Cypher queries
│   │   │   ├── routes/contrarian.routes.ts
│   │   │   └── index.ts
│   │   └── .env.example
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # UI components
│       │   ├── lib/api.ts      # API client
│       │   └── App.tsx         # Routes & layout
│       └── .env.example
├── python/                     # Data collection (8 scripts)
│   ├── step-1.py → step-9.py
│   └── README.md
├── README.md                   # This file
├── QUERIES.md                  # Cypher documentation
└── GETTING_STARTED.md          # Quick start guide
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend

```bash
cd apps/api
cp .env.example .env
# Edit .env with your Neo4j AuraDB credentials
```

### 3. Start Servers

```bash
# Terminal 1 - Backend
cd apps/api && npm run dev

# Terminal 2 - Frontend
cd apps/web && npm run dev
```

### 4. Open Application

Navigate to http://localhost:5173

## Data Collection

Populate Neo4j with Polymarket data using Python scripts:

```bash
cd python
pip install neo4j requests tqdm

# Set environment variables
export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"

# Run scripts in order
python step-1.py  # Install packages
python step-2.py  # Initialize
python step-3.py  # Test connections
python step-4.py  # Fetch 150 events from Polymarket Gamma API
python step-5.py  # Extract outcomes and condition IDs
python step-6.py  # Fetch ALL trades with pagination from Polymarket Data API
python step-8.py  # Import to Neo4j (includes wallet preparation)
python step-9.py  # Verify database
```

See `python/README.md` for details.

## Database Schema

### Graph Structure

```
(User)-[:PLACED_TRADE]->(Trade)-[:FOR_OUTCOME]->(Outcome)
                          |                        |
                     [:ON_MARKET]           [:HAS_OUTCOME]
                          |                        |
                       (Market)-[:PART_OF_EVENT]->(Event)
```

### Nodes

- **User**: Traders with profile data (address, name, pseudonym, profile_image)
- **Trade**: Transactions (price, size_usdc, side, timestamp, tx_hash)
- **Market**: Prediction markets (question, resolved, winning_outcome)
- **Event**: Market groups (category, volume)
- **Outcome**: Market results (outcome_name, token_id)
- **Contract**: Polymarket smart contracts

### Relationships

- `[:PLACED_TRADE]` - User → Trade
- `[:ON_MARKET]` - Trade → Market
- `[:FOR_OUTCOME]` - Trade → Outcome
- `[:HAS_OUTCOME]` - Market → Outcome
- `[:PART_OF_EVENT]` - Market → Event
- `[:HOLDS]` - User → Outcome (derived)
- `[:SAME_GROUP]` - Market → Market

### Indexes & Constraints

```cypher
-- Uniqueness
CREATE CONSTRAINT user_address FOR (u:User) REQUIRE u.address IS UNIQUE;
CREATE CONSTRAINT market_condition_id FOR (m:Market) REQUIRE m.condition_id IS UNIQUE;
CREATE CONSTRAINT trade_hash FOR (t:Trade) REQUIRE t.transaction_hash IS UNIQUE;

-- Performance
CREATE INDEX market_resolved FOR (m:Market) ON (m.resolved);
CREATE INDEX trade_side FOR (t:Trade) ON (t.side);
CREATE INDEX event_category FOR (e:Event) ON (e.category);
```

## Cypher Queries

The application implements **9 production-ready Cypher queries**:

### Core Queries

1. **Contrarian Leaderboard** - Top trades by ROI with filters (limit, category, minRoi, maxEntryPrice)
2. **Success Rate by Category** - Category-wise contrarian success analysis
3. **Top Contrarian Traders** - Aggregated trader profiles and statistics
4. **Available Categories** - Dynamic category list for filters

### Visualization Queries

5. **Trader Network** - Connections between traders via shared markets
6. **Market Correlation** - Markets connected by common traders
7. **Category Flow** - Trader transitions between categories over time
8. **Contrarian Timeline** - Historical contrarian opportunities

### System Query

9. **Database Statistics** - Real-time Neo4j health and metrics

See [`QUERIES.md`](QUERIES.md) for detailed Cypher implementations and examples.

## API Endpoints

All endpoints return JSON: `{ success: boolean, count: number, data: T[], filters?: object }`

| Method | Endpoint                        | Parameters                             | Description              |
| ------ | ------------------------------- | -------------------------------------- | ------------------------ |
| GET    | `/api/contrarians/leaderboard`  | limit, category, minRoi, maxEntryPrice | Top contrarian trades    |
| GET    | `/api/contrarians/success-rate` | maxEntryPrice                          | Success rate by category |
| GET    | `/api/contrarians/top-traders`  | limit, minWins, maxEntryPrice          | Top traders profile      |
| GET    | `/api/contrarians/categories`   | -                                      | Available categories     |
| GET    | `/api/network/traders`          | minShared, limit                       | Trader network           |
| GET    | `/api/network/markets`          | minShared, limit                       | Market correlation       |
| GET    | `/api/flow/categories`          | -                                      | Category flow            |
| GET    | `/api/timeline/contrarian`      | maxEntryPrice                          | Timeline                 |
| GET    | `/api/stats/database`           | -                                      | DB health & stats        |
| GET    | `/api/health`                   | -                                      | Health check             |

## Key Design Decisions

### 1. Graph Database Choice

**Decision**: Neo4j for relationship-heavy data  
**Rationale**: Natural representation of trader-trade-market-event relationships; efficient pattern matching; flexible schema for evolving data model

### 2. Monorepo Architecture

**Decision**: npm workspaces with shared TypeScript types  
**Rationale**: Code reuse between frontend/backend; consistent tooling; simplified development workflow

### 3. Pagination Strategy (Python)

**Decision**: Per-market fetching with 2,000 trade limit  
**Rationale**: Ensures fair data distribution across markets; prevents single active markets from dominating dataset; balances completeness with performance

### 4. Contrarian Definition

**Decision**: Entry price < 20% (default, user-configurable)  
**Rationale**: Captures genuine contrarian positions (buying when <20% probability); configurable for different risk profiles

### 5. Component Architecture

**Decision**: Atomic components with shadcn/ui + Tailwind CSS  
**Rationale**: Reusable, maintainable UI components; consistent styling; no heavy UI library dependencies

### 6. Query Optimization

**Decision**: Indexed properties + parameterized queries  
**Rationale**: Query plan caching; sub-100ms response times; scalable performance

### 7. Data Source Strategy

**Decision**: Polymarket public APIs (Gamma + Data API)  
**Rationale**: Official, reliable data sources; no blockchain scraping required; includes trader profile data

## Data Sources & Citations

### Primary Data Sources

**Polymarket** (2025). _Prediction market platform_.

- Website: https://polymarket.com/
- Gamma API: https://gamma-api.polymarket.com/ (Events, Markets, Outcomes)
- Data API: https://data-api.polymarket.com/ (Trades, User Profiles)
- Accessed: December 2025

**Data Collection Method**:

- 150 closed/resolved events
- ~300-400 markets (2-3 per event)
- ~18,000 trades with full trader profiles
- ~7,000 unique traders
- Complete trade history via pagination

**Data Freshness**: Historical data from resolved markets (last 3-6 months)

## Performance

Tested on database with 150 events, 400 markets, 18K trades, 7K users:

| Query                    | Avg Time |
| ------------------------ | -------- |
| Contrarian Leaderboard   | < 100ms  |
| Success Rate by Category | < 50ms   |
| Top Traders              | < 80ms   |
| Trader Network           | < 150ms  |
| Market Correlation       | < 120ms  |
| Category Flow            | < 80ms   |

## Development Process

### Phase 1: Data Exploration

- Analyzed Polymarket API structure
- Identified Neo4j as optimal database
- Designed graph schema based on data relationships

### Phase 2: Data Pipeline

- Built Python scripts for data collection
- Implemented pagination for complete trade history
- Optimized batch imports with Neo4j UNWIND

### Phase 3: Backend Development

- Implemented 9 Cypher queries
- Created RESTful API with Fastify
- Added parameter validation with Zod

### Phase 4: Frontend Development

- Built React components with TypeScript
- Implemented interactive filters and routing
- Added network visualizations with React Flow

### Phase 5: Optimization & Polish

- Indexed critical properties
- Component refactoring for maintainability
- Added real-time database health monitoring
- Comprehensive documentation

## Project Requirements Met ✅

**Assignment Requirements** (Knowledge-Based Systems Course):

- ✅ **Graph dataset**: Neo4j with Polymarket data (~18K trades, ~400 markets)
- ✅ **Interactive application**: React frontend with dynamic query parameters
- ✅ **3-5 meaningful queries**: 9 queries implemented (exceeds requirement)
- ✅ **Query variety**: Pattern matching, aggregation, multi-level aggregation, network analysis
- ✅ **Documentation**: README, QUERIES.md, inline code comments
- ✅ **Visualization**: Tables, cards, network graphs, flow diagrams
- ✅ **Data source citation**: Polymarket APIs properly referenced

## License

MIT

## Author

Built by Timon Stadelmann for Knowledge-Based Systems (FHV, December 2025)

## References

- Polymarket. (2025). _Prediction Market Platform_. https://polymarket.com/
- Neo4j. (2025). _Cypher Query Language Manual_. https://neo4j.com/docs/cypher-manual/
- React Router. (2025). _Documentation_. https://reactrouter.com/
- Fastify. (2025). _Web Framework Documentation_. https://www.fastify.io/
