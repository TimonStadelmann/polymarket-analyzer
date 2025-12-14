# Quick Start Guide

Get the Polymarket Contrarian Finder running in 3 steps.

## Prerequisites

- Node.js 20+
- Neo4j AuraDB instance
- Git

## 1. Install & Configure

```bash
# Clone and install
git clone <repo-url>
cd polymarket
npm install

# Configure backend
cd apps/api
cp .env.example .env
# Edit .env with Neo4j credentials:
# NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=your-password
```

## 2. Start Servers

```bash
# Terminal 1 - Backend (port 3000)
cd apps/api
npm run dev

# Terminal 2 - Frontend (port 5173)
cd apps/web
npm run dev
```

## 3. Open Application

Navigate to http://localhost:5173

## Populate Database (If Empty)

```bash
cd python
pip install neo4j requests tqdm

# Set environment
export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"

# Run scripts (10-20 minutes total)
python step-1.py  # Install
python step-2.py  # Initialize
python step-3.py  # Test
python step-4.py  # Fetch events
python step-5.py  # Extract outcomes
python step-6.py  # Fetch trades (~5-15 min)
python step-8.py  # Import to Neo4j (~2-5 min)
python step-9.py  # Verify
```

## Features

- **Leaderboard**: Top contrarian trades with filters
- **Statistics**: Category success rates
- **Top Traders**: Trader profiles and aggregated stats
- **Visualizations**: Trader networks, market correlations, category flows
- **DB Monitor**: Real-time Neo4j health in header

## Test API

```bash
curl http://localhost:3000/api/contrarians/leaderboard?limit=5
curl http://localhost:3000/api/health
curl http://localhost:3000/api/stats/database
```

## Troubleshooting

**Backend won't start**

- Check Neo4j credentials in `apps/api/.env`
- Verify port 3000 is available

**No data showing**

- Run Python scripts to populate Neo4j
- Check backend logs for errors
- Verify database has data: `python step-9.py`

**Frontend can't connect**

- Ensure backend is running on port 3000
- Check `VITE_API_URL` in `apps/web/.env` (optional)

## Documentation

- **README.md**: Full project documentation
- **QUERIES.md**: Cypher query details
- **python/README.md**: Data collection guide

## Data Source

All data from [Polymarket](https://polymarket.com/) via public APIs:

- Gamma API: Events, Markets, Outcomes
- Data API: Trades, User Profiles

---

**You're ready!** 🚀 The application analyzes ~18K trades from ~7K traders across 400 prediction markets.
