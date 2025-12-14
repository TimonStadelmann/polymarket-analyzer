import neo4j, { Driver, Session } from 'neo4j-driver';
import 'dotenv/config';

let driver: Driver | null = null;

export function initNeo4jDriver() {
	if (!driver) {
		driver = neo4j.driver(
			process.env.NEO4J_URI!,
			neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
		);
	}
	return driver;
}

export async function closeNeo4jDriver() {
	if (driver) {
		await driver.close();
		driver = null;
	}
}

export async function getContrariansLeaderboard(
	options: {
		limit?: number;
		category?: string;
		minRoi?: number;
		maxEntryPrice?: number;
	} = {}
) {
	const { limit = 20, category, minRoi = 0, maxEntryPrice = 0.2 } = options;
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const categoryFilter = category && category !== 'All' ? 'AND e.category = $category' : '';

		const result = await session.run(
			`
      MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
      MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
      WHERE m.resolved = true
        AND m.winning_outcome = o.outcome_name
        AND t.side = 'BUY'
        AND t.price < $maxEntryPrice
        AND t.price > 0.0
        ${categoryFilter}
      WITH u, t, m, e, o,
           (1.0 - t.price) / t.price as roi_multiplier,
           t.size_usdc / t.price as potential_payout
      WHERE roi_multiplier * 100 >= $minRoi
      RETURN u.address as trader_address,
             u.name as trader_name,
             u.pseudonym as trader_pseudonym,
             u.profile_image as trader_image,
             m.question as market_question,
             m.slug as market_slug,
             e.category as category,
             o.outcome_name as outcome,
             t.price as entry_price,
             t.size_usdc as investment_usd,
             potential_payout as payout_usd,
             roi_multiplier * 100 as roi_percent,
             t.timestamp as trade_time,
             t.transaction_hash as tx_hash
      ORDER BY roi_percent DESC, investment_usd DESC
      LIMIT $limit
      `,
			{
				limit: neo4j.int(limit),
				category,
				minRoi,
				maxEntryPrice,
			}
		);

		return result.records.map((record: Record<string, any>) => {
			const obj = record.toObject();
			return {
				...obj,
				entry_price: Number(obj.entry_price),
				investment_usd: Number(obj.investment_usd),
				payout_usd: Number(obj.payout_usd),
				roi_percent: Number(obj.roi_percent),
				trade_time: obj.trade_time.toString(),
			};
		});
	} finally {
		await session.close();
	}
}

export async function getCategories() {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(`
      MATCH (e:Event)
      RETURN DISTINCT e.category as category
      ORDER BY category
    `);

		return result.records.map((record: Record<string, any>) => record.get('category'));
	} finally {
		await session.close();
	}
}

export async function getSuccessRateByCategory(maxEntryPrice: number = 0.2) {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
      MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
      MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
      WHERE m.resolved = true
        AND t.side = 'BUY'
        AND t.price < $maxEntryPrice
        AND t.price > 0.0
      WITH e.category as category,
           m,
           o,
           t,
           (m.winning_outcome = o.outcome_name) as is_winner
      WITH category,
           count(DISTINCT t) as total_contrarian_bets,
           sum(CASE WHEN is_winner THEN 1 ELSE 0 END) as winning_bets,
           sum(CASE WHEN is_winner THEN t.size_usdc ELSE 0 END) as winning_volume,
           sum(t.size_usdc) as total_volume,
           avg(t.price) as avg_entry_price
      RETURN category,
             total_contrarian_bets,
             winning_bets,
             (toFloat(winning_bets) / total_contrarian_bets * 100) as success_rate,
             winning_volume,
             total_volume,
             avg_entry_price
      ORDER BY success_rate DESC
      `,
			{ maxEntryPrice }
		);

		return result.records.map((record: Record<string, any>) => {
			const obj = record.toObject();
			return {
				category: obj.category,
				total_contrarian_bets: Number(obj.total_contrarian_bets),
				winning_bets: Number(obj.winning_bets),
				success_rate: Number(obj.success_rate),
				winning_volume: Number(obj.winning_volume),
				total_volume: Number(obj.total_volume),
				avg_entry_price: Number(obj.avg_entry_price),
			};
		});
	} finally {
		await session.close();
	}
}

export async function getTopContrarianTraders(
	options: {
		limit?: number;
		minWins?: number;
		maxEntryPrice?: number;
	} = {}
) {
	const { limit = 20, minWins = 2, maxEntryPrice = 0.2 } = options;
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
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
      WITH u, contrarian_wins, total_investment, total_payout, avg_entry_price, best_entry_price,
           (total_payout - total_investment) as profit
      RETURN u.address as trader_address,
             u.name as trader_name,
             u.pseudonym as trader_pseudonym,
             u.profile_image as trader_image,
             contrarian_wins,
             total_investment,
             total_payout,
             profit,
             (profit / total_investment * 100) as roi_percent,
             avg_entry_price,
             best_entry_price
      ORDER BY contrarian_wins DESC, profit DESC
      LIMIT $limit
      `,
			{
				limit: neo4j.int(limit),
				minWins: neo4j.int(minWins),
				maxEntryPrice,
			}
		);

		return result.records.map((record: Record<string, any>) => {
			const obj = record.toObject();
			return {
				trader_address: obj.trader_address,
				trader_name: obj.trader_name,
				trader_pseudonym: obj.trader_pseudonym,
				trader_image: obj.trader_image,
				contrarian_wins: Number(obj.contrarian_wins),
				total_investment: Number(obj.total_investment),
				total_payout: Number(obj.total_payout),
				profit: Number(obj.profit),
				roi_percent: Number(obj.roi_percent),
				avg_entry_price: Number(obj.avg_entry_price),
				best_entry_price: Number(obj.best_entry_price),
			};
		});
	} finally {
		await session.close();
	}
}

// Query 5: Trader Network - Find traders who trade on similar markets
export async function getTraderNetwork(minSharedMarkets: number = 2, limit: number = 50) {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
  MATCH (u1:User)-[:PLACED_TRADE]->(t1:Trade)-[:ON_MARKET]->(m:Market)
  MATCH (u2:User)-[:PLACED_TRADE]->(t2:Trade)-[:ON_MARKET]->(m)
  WHERE u1.address < u2.address
  WITH u1, u2, count(DISTINCT m) as shared_markets, 
       count(DISTINCT t1) as u1_trades,
       count(DISTINCT t2) as u2_trades
  WHERE shared_markets >= $minSharedMarkets
  RETURN u1.address as trader1_address,
         u1.name as trader1_name,
         u1.pseudonym as trader1_pseudonym,
         u1.profile_image as trader1_image,
         u2.address as trader2_address,
         u2.name as trader2_name,
         u2.pseudonym as trader2_pseudonym,
         u2.profile_image as trader2_image,
         shared_markets,
         u1_trades,
         u2_trades
  ORDER BY shared_markets DESC
  LIMIT $limit
  `,
			{
				minSharedMarkets: neo4j.int(minSharedMarkets),
				limit: neo4j.int(limit),
			}
		);

		return result.records.map((record: any) => {
			const obj = record.toObject();
			return {
				trader1: {
					address: obj.trader1_address,
					name: obj.trader1_name,
					pseudonym: obj.trader1_pseudonym,
					image: obj.trader1_image,
					trades: Number(obj.u1_trades),
				},
				trader2: {
					address: obj.trader2_address,
					name: obj.trader2_name,
					pseudonym: obj.trader2_pseudonym,
					image: obj.trader2_image,
					trades: Number(obj.u2_trades),
				},
				shared_markets: Number(obj.shared_markets),
			};
		});
	} finally {
		await session.close();
	}
}

// Query 6: Market Correlation - Find markets that share traders
export async function getMarketCorrelation(minSharedTraders: number = 3, limit: number = 50) {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
  MATCH (m1:Market)<-[:ON_MARKET]-(t1:Trade)<-[:PLACED_TRADE]-(u:User)
  MATCH (u)-[:PLACED_TRADE]->(t2:Trade)-[:ON_MARKET]->(m2:Market)
  WHERE id(m1) < id(m2)
  WITH m1, m2, count(DISTINCT u) as shared_traders,
       [(m1)-[:PART_OF_EVENT]->(e1:Event) | e1.category][0] as cat1,
       [(m2)-[:PART_OF_EVENT]->(e2:Event) | e2.category][0] as cat2
  WHERE shared_traders >= $minSharedTraders
  RETURN m1.condition_id as market1_id,
         m1.question as market1_question,
         m1.slug as market1_slug,
         cat1 as market1_category,
         m2.condition_id as market2_id,
         m2.question as market2_question,
         m2.slug as market2_slug,
         cat2 as market2_category,
         shared_traders
  ORDER BY shared_traders DESC
  LIMIT $limit
  `,
			{
				minSharedTraders: neo4j.int(minSharedTraders),
				limit: neo4j.int(limit),
			}
		);

		return result.records.map((record: any) => {
			const obj = record.toObject();
			return {
				market1: {
					id: obj.market1_id,
					question: obj.market1_question,
					slug: obj.market1_slug,
					category: obj.market1_category || 'Unknown',
				},
				market2: {
					id: obj.market2_id,
					question: obj.market2_question,
					slug: obj.market2_slug,
					category: obj.market2_category || 'Unknown',
				},
				shared_traders: Number(obj.shared_traders),
			};
		});
	} finally {
		await session.close();
	}
}

// Query 7: Category Flow - Find how traders transition between categories
export async function getCategoryFlow() {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
  MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:ON_MARKET]->(m:Market)-[:PART_OF_EVENT]->(e:Event)
  WITH u, e.category as category, t.timestamp as timestamp
  ORDER BY u.address, timestamp
  WITH u, collect(DISTINCT category) as categories
  WHERE size(categories) > 1
  UNWIND range(0, size(categories)-2) as i
  WITH categories[i] as from_category, categories[i+1] as to_category
  WHERE from_category <> to_category
  RETURN from_category, to_category, count(*) as transitions
  ORDER BY transitions DESC
  `
		);

		return result.records.map((record: any) => {
			const obj = record.toObject();
			return {
				from: obj.from_category,
				to: obj.to_category,
				value: Number(obj.transitions),
			};
		});
	} finally {
		await session.close();
	}
}

// Query 8: Contrarian Timeline - Get contrarian trades over time
export async function getContrarianTimeline(maxEntryPrice: number = 0.2) {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		const result = await session.run(
			`
  MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
  MATCH (o)<-[:HAS_OUTCOME]-(m:Market)-[:PART_OF_EVENT]->(e:Event)
  WHERE m.resolved = true 
    AND m.winning_outcome = o.outcome_name
    AND t.side = 'BUY' 
    AND t.price < $maxEntryPrice
    AND t.price > 0.0
  RETURN t.timestamp as timestamp,
         t.date as date,
         e.category as category,
         t.price as entry_price,
         (1.0 - t.price) / t.price * 100 as roi_percent,
         m.question as market_question,
         o.outcome_name as outcome,
         t.size_usdc as investment,
         u.address as trader_address,
         u.name as trader_name
  ORDER BY t.timestamp
  `,
			{ maxEntryPrice }
		);

		return result.records.map((record: any) => {
			const obj = record.toObject();
			return {
				timestamp: Number(obj.timestamp),
				date: obj.date || new Date(Number(obj.timestamp) * 1000).toISOString(),
				category: obj.category,
				entry_price: Number(obj.entry_price),
				roi_percent: Number(obj.roi_percent),
				market_question: obj.market_question,
				outcome: obj.outcome,
				investment: Number(obj.investment),
				trader_address: obj.trader_address,
				trader_name: obj.trader_name,
			};
		});
	} finally {
		await session.close();
	}
}

// Query 9: Database Statistics and Health
export async function getDatabaseStats() {
	const driver = initNeo4jDriver();
	const session = driver.session();

	try {
		// Get node counts.
		const nodeCountsResult = await session.run(`
      MATCH (n)
      WITH labels(n)[0] as label, count(*) as count
      RETURN label, count
      ORDER BY count DESC
    `);

		const nodeCounts: Record<string, number> = {};
		nodeCountsResult.records.forEach((record: Record<string, any>) => {
			const obj = record.toObject();
			nodeCounts[obj.label] = Number(obj.count);
		});

		// Get relationship counts.
		const relCountsResult = await session.run(`
      MATCH ()-[r]->()
      WITH type(r) as rel_type, count(*) as count
      RETURN rel_type, count
      ORDER BY count DESC
    `);

		const relationshipCounts: Record<string, number> = {};
		relCountsResult.records.forEach((record: Record<string, any>) => {
			const obj = record.toObject();
			relationshipCounts[obj.rel_type] = Number(obj.count);
		});

		// Get total volume.
		const volumeResult = await session.run(`
      MATCH (t:Trade)
      RETURN sum(t.size_usdc) as total_volume
    `);
		const totalVolume = Number(volumeResult.records[0].get('total_volume'));

		// Get resolved markets count.
		const resolvedResult = await session.run(`
      MATCH (m:Market)
      WHERE m.resolved = true
      RETURN count(m) as resolved_count
    `);
		const resolvedMarkets = Number(resolvedResult.records[0].get('resolved_count'));

		// Check database health.
		const healthResult = await session.run('RETURN 1 as health');
		const isHealthy = healthResult.records.length > 0;

		return {
			nodes: nodeCounts,
			relationships: relationshipCounts,
			stats: {
				total_events: nodeCounts['Event'] || 0,
				total_markets: nodeCounts['Market'] || 0,
				total_users: nodeCounts['User'] || 0,
				total_trades: nodeCounts['Trade'] || 0,
				total_outcomes: nodeCounts['Outcome'] || 0,
				resolved_markets: resolvedMarkets,
				total_volume_usd: totalVolume,
			},
			health: {
				status: isHealthy ? 'healthy' : 'unhealthy',
				timestamp: new Date().toISOString(),
			},
		};
	} finally {
		await session.close();
	}
}
