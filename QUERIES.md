# Cypher Queries Documentation

This document describes the **9 Cypher queries** implemented in the Polymarket Contrarian Finder.

**Data Source**: All queries analyze data from [Polymarket](https://polymarket.com/) prediction markets, fetched via their Gamma API (events/markets) and Data API (trades/profiles).

---

## Query Overview

### Core Queries (1-4)

1. **Contrarian Leaderboard** - Top trades by ROI with filters
2. **Success Rate by Category** - Category-wise success analysis
3. **Top Contrarian Traders** - Aggregated trader profiles
4. **Available Categories** - Dynamic category filter list

### Visualization Queries (5-8)

5. **Trader Network** - Trader connections via shared markets
6. **Market Correlation** - Markets with shared traders
7. **Category Flow** - Trader category transitions
8. **Contrarian Timeline** - Historical opportunities

### System Query (9)

9. **Database Statistics** - Real-time health & metrics

---

## Query 1: Contrarian Leaderboard

**Purpose**: Find traders who bought winning outcomes at very low prices

**Endpoint**: `GET /api/contrarians/leaderboard?limit=20&category=Politics&minRoi=0&maxEntryPrice=0.2`

**Parameters**:

- `limit` (default: 20) - Results count
- `category` (optional) - Filter by event category
- `minRoi` (default: 0) - Minimum ROI percentage
- `maxEntryPrice` (default: 0.20) - Maximum entry price (contrarian threshold)

**Query**:

```cypher
MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
WHERE m.resolved = true
  AND m.winning_outcome = o.outcome_name
  AND t.side = 'BUY'
  AND t.price < $maxEntryPrice
  AND t.price > 0.0
WITH u, t, m, e, o,
     (1.0 - t.price) / t.price as roi_multiplier,
     t.size_usdc / t.price as potential_payout
WHERE roi_multiplier * 100 >= $minRoi
RETURN u.address, u.name, u.pseudonym, u.profile_image,
       m.question, m.slug, e.category, o.outcome_name,
       t.price as entry_price, t.size_usdc as investment_usd,
       potential_payout as payout_usd, roi_multiplier * 100 as roi_percent,
       t.timestamp, t.transaction_hash
ORDER BY roi_percent DESC, investment_usd DESC
LIMIT $limit
```

**ROI Calculation**: `ROI = (1.00 - Entry Price) / Entry Price × 100`

**Example**: Entry at 3% → ROI = (1.00 - 0.03) / 0.03 × 100 = **3,233%**

---

## Query 2: Success Rate by Category

**Purpose**: Analyze which categories reward contrarian strategies

**Endpoint**: `GET /api/contrarians/success-rate?maxEntryPrice=0.2`

**Query**:

```cypher
MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
WHERE m.resolved = true
  AND t.side = 'BUY'
  AND t.price < $maxEntryPrice
  AND t.price > 0.0
WITH e.category as category, m, o, t,
     (m.winning_outcome = o.outcome_name) as is_winner
WITH category,
     count(DISTINCT t) as total_contrarian_bets,
     sum(CASE WHEN is_winner THEN 1 ELSE 0 END) as winning_bets,
     sum(CASE WHEN is_winner THEN t.size_usdc ELSE 0 END) as winning_volume,
     sum(t.size_usdc) as total_volume,
     avg(t.price) as avg_entry_price
RETURN category, total_contrarian_bets, winning_bets,
       (toFloat(winning_bets) / total_contrarian_bets * 100) as success_rate,
       winning_volume, total_volume, avg_entry_price
ORDER BY success_rate DESC
```

**Key Feature**: Conditional aggregation with `CASE WHEN` for winning vs. total metrics

---

## Query 3: Top Contrarian Traders

**Purpose**: Find traders with most successful contrarian wins

**Endpoint**: `GET /api/contrarians/top-traders?limit=20&minWins=2&maxEntryPrice=0.2`

**Query**:

```cypher
MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
MATCH (o)<-[:HAS_OUTCOME]-(m:Market)
WHERE m.resolved = true
  AND m.winning_outcome = o.outcome_name
  AND t.side = 'BUY'
  AND t.price < $maxEntryPrice
WITH u,
     count(DISTINCT t) as contrarian_wins,
     sum(t.size_usdc) as total_investment,
     sum(t.size_usdc / t.price) as total_payout,
     avg(t.price) as avg_entry_price,
     min(t.price) as best_entry_price
WHERE contrarian_wins >= $minWins
WITH u, contrarian_wins, total_investment, total_payout,
     avg_entry_price, best_entry_price,
     (total_payout - total_investment) as profit
RETURN u.address, u.name, u.pseudonym, u.profile_image,
       contrarian_wins, total_investment, total_payout, profit,
       (profit / total_investment * 100) as roi_percent,
       avg_entry_price, best_entry_price
ORDER BY contrarian_wins DESC, profit DESC
LIMIT $limit
```

**Key Feature**: Multi-level aggregation with profit calculation

---

## Query 4: Available Categories

**Purpose**: Fetch unique categories for filter dropdowns

**Endpoint**: `GET /api/contrarians/categories`

**Query**:

```cypher
MATCH (e:Event)
RETURN DISTINCT e.category as category
ORDER BY category
```

---

## Query 5: Trader Network

**Purpose**: Find connections between traders via shared markets

**Endpoint**: `GET /api/network/traders?minShared=2&limit=50`

**Query**:

```cypher
MATCH (u1:User)-[:PLACED_TRADE]->(:Trade)-[:ON_MARKET]->(m:Market)
      <-[:ON_MARKET]-(:Trade)<-[:PLACED_TRADE]-(u2:User)
WHERE u1.address < u2.address
WITH u1, u2, COUNT(DISTINCT m) as shared_markets
WHERE shared_markets >= $minShared
RETURN u1.address, u1.name, u1.pseudonym, u1.profile_image,
       u2.address, u2.name, u2.pseudonym, u2.profile_image,
       shared_markets
ORDER BY shared_markets DESC
LIMIT $limit
```

**Key Feature**: Symmetric filtering (`u1.address < u2.address`) prevents duplicate pairs

---

## Query 6: Market Correlation

**Purpose**: Find markets that share common traders

**Endpoint**: `GET /api/network/markets?minShared=3&limit=50`

**Query**:

```cypher
MATCH (m1:Market)<-[:ON_MARKET]-(:Trade)<-[:PLACED_TRADE]-(u:User)
      -[:PLACED_TRADE]->(:Trade)-[:ON_MARKET]->(m2:Market)
WHERE m1.condition_id < m2.condition_id
WITH m1, m2, COUNT(DISTINCT u) as shared_traders
WHERE shared_traders >= $minShared
MATCH (m1)-[:PART_OF_EVENT]->(e1:Event)
MATCH (m2)-[:PART_OF_EVENT]->(e2:Event)
RETURN m1.condition_id, m1.question, m1.slug, e1.category,
       m2.condition_id, m2.question, m2.slug, e2.category,
       shared_traders
ORDER BY shared_traders DESC
LIMIT $limit
```

**Key Feature**: Category enrichment for visualization color coding

---

## Query 7: Category Flow

**Purpose**: Track trader transitions between market categories over time

**Endpoint**: `GET /api/flow/categories`

**Query**:

```cypher
MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:ON_MARKET]->(m:Market)
      -[:PART_OF_EVENT]->(e:Event)
WITH u, e.category as category, t.timestamp as timestamp
ORDER BY u.address, timestamp
WITH u, collect(DISTINCT category) as categories
WHERE size(categories) > 1
UNWIND range(0, size(categories)-2) as i
WITH categories[i] as from_category, categories[i+1] as to_category
WHERE from_category <> to_category
RETURN from_category, to_category, count(*) as transitions
ORDER BY transitions DESC
```

**Key Feature**: Temporal ordering to track chronological category changes

---

## Query 8: Contrarian Timeline

**Purpose**: Visualize contrarian opportunities over time

**Endpoint**: `GET /api/timeline/contrarian?maxEntryPrice=0.2`

**Query**:

```cypher
MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
WHERE m.resolved = true
  AND m.winning_outcome = o.outcome_name
  AND t.side = 'BUY'
  AND t.price < $maxEntryPrice
  AND t.price > 0.0
RETURN t.timestamp, e.category, t.price as entry_price,
       (1.0 - t.price) / t.price * 100 as roi_percent,
       m.question, o.outcome_name, t.size_usdc as investment,
       u.address, u.name
ORDER BY t.timestamp
```

**Key Feature**: Temporal data for timeline/scatter plot visualizations

---

## Query 9: Database Statistics

**Purpose**: Real-time Neo4j health monitoring and metrics

**Endpoint**: `GET /api/stats/database`

**Query** (multiple sub-queries):

```cypher
// Node counts
MATCH (n)
WITH labels(n)[0] as label, count(*) as count
RETURN label, count

// Relationship counts
MATCH ()-[r]->()
WITH type(r) as rel_type, count(*) as count
RETURN rel_type, count

// Total volume
MATCH (t:Trade)
RETURN sum(t.size_usdc) as total_volume

// Resolved markets
MATCH (m:Market)
WHERE m.resolved = true
RETURN count(m) as resolved_count

// Health check
RETURN 1 as health
```

**Returns**: Node counts, relationship counts, volume, resolved markets, health status

---

## Performance Optimization

### Indexes

```cypher
CREATE INDEX market_resolved FOR (m:Market) ON (m.resolved);
CREATE INDEX trade_side FOR (t:Trade) ON (t.side);
CREATE INDEX trade_price FOR (t:Trade) ON (t.price);
CREATE INDEX event_category FOR (e:Event) ON (e.category);
CREATE INDEX trade_timestamp FOR (t:Trade) ON (t.timestamp);
```

### Constraints

```cypher
CREATE CONSTRAINT user_address FOR (u:User) REQUIRE u.address IS UNIQUE;
CREATE CONSTRAINT market_condition_id FOR (m:Market) REQUIRE m.condition_id IS UNIQUE;
CREATE CONSTRAINT trade_hash FOR (t:Trade) REQUIRE t.transaction_hash IS UNIQUE;
```

### Execution Times

Database: 150 events, 400 markets, 18K trades, 7K users

| Query                    | Avg Time |
| ------------------------ | -------- |
| Contrarian Leaderboard   | < 100ms  |
| Success Rate by Category | < 50ms   |
| Top Traders              | < 80ms   |
| Categories               | < 10ms   |
| Trader Network           | < 150ms  |
| Market Correlation       | < 120ms  |
| Category Flow            | < 80ms   |
| Timeline                 | < 100ms  |
| Database Stats           | < 50ms   |

---

## Query Design Principles

1. **Use Indexes**: All WHERE clauses target indexed properties
2. **Parameterize**: All queries use parameters for plan caching
3. **Filter Early**: WHERE clauses before WITH for better performance
4. **Limit Appropriately**: LIMIT applied in Cypher, not application code
5. **Avoid Cartesian Products**: Explicit relationship patterns prevent explosions

---

## Data Source Citation

**Polymarket** (2025). _Prediction Market Platform_.

- Gamma API: https://gamma-api.polymarket.com/ (Events, Markets, Outcomes)
- Data API: https://data-api.polymarket.com/ (Trades, User Profiles)
- Accessed: December 2025

All queries analyze real trading data from Polymarket's public APIs, covering 150 historical events with ~18,000 trades from ~7,000 unique traders.
