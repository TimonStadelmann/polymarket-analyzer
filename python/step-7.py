import json
from datetime import datetime
from tqdm.notebook import tqdm

print('=' * 70)
print('Importing Data to Neo4j')
print('=' * 70)
print()

# Prepare user data from trades with Polymarket profile data.
print('[0/10] Preparing user data...')
user_profiles = {}
null_address = '0x0000000000000000000000000000000000000000'

for trade in all_token_transfers:
    trader_addr = trade.get('from')
    if not trader_addr or trader_addr == null_address:
        continue
    
    if trader_addr not in user_profiles:
        user_profiles[trader_addr] = {
            'address': trader_addr,
            'role': 'trader',
            'name': trade.get('user_name', ''),
            'pseudonym': trade.get('user_pseudonym', ''),
            'bio': trade.get('user_bio', ''),
            'profile_image': trade.get('user_profile_image', ''),
            'profile_image_optimized': trade.get('user_profile_image_optimized', ''),
        }

print(f'  ✓ Prepared {len(user_profiles)} users\n')

def create_schema(driver):
    """Create constraints and indexes."""
    print('[1/9] Creating schema...')
    
    statements = [
        # Constraints.
        'CREATE CONSTRAINT user_address IF NOT EXISTS FOR (u:User) REQUIRE u.address IS UNIQUE',
        'CREATE CONSTRAINT event_slug IF NOT EXISTS FOR (e:Event) REQUIRE e.slug IS UNIQUE',
        'CREATE CONSTRAINT market_condition_id IF NOT EXISTS FOR (m:Market) REQUIRE m.condition_id IS UNIQUE',
        'CREATE CONSTRAINT outcome_id IF NOT EXISTS FOR (o:Outcome) REQUIRE (o.condition_id, o.outcome_index) IS UNIQUE',
        'CREATE CONSTRAINT trade_hash IF NOT EXISTS FOR (t:Trade) REQUIRE t.transaction_hash IS UNIQUE',
        
        # Indexes.
        'CREATE INDEX event_category IF NOT EXISTS FOR (e:Event) ON (e.category)',
        'CREATE INDEX event_closed IF NOT EXISTS FOR (e:Event) ON (e.closed)',
        'CREATE INDEX market_slug IF NOT EXISTS FOR (m:Market) ON (m.slug)',
        'CREATE INDEX trade_timestamp IF NOT EXISTS FOR (t:Trade) ON (t.timestamp)',
        'CREATE INDEX trade_side IF NOT EXISTS FOR (t:Trade) ON (t.side)',
        'CREATE INDEX user_role IF NOT EXISTS FOR (u:User) ON (u.role)',
    ]
    
    with driver.session() as session:
        for stmt in statements:
            try:
                session.run(stmt)
            except Exception:
                pass  # Constraint/index may already exist
    
    print('  ✓ Schema created\n')

def clear_database(driver):
    """Clear all data."""
    print('[2/9] Clearing database...')
    with driver.session() as session:
        session.run('MATCH (n) DETACH DELETE n')
    print('  ✓ Database cleared\n')

def import_events(driver, events):
    """Import Event nodes in batch."""
    print('[3/9] Importing events...')
    
    # Prepare data.
    event_data = []
    for event in events:
        tags = event.get('tags', [])
        tag_labels = [tag.get('label', '') for tag in tags if tag.get('label')]
        
        event_data.append({
            'slug': event.get('slug'),
            'title': event.get('title', ''),
            'description': event.get('description', ''),
            'category': event.get('category', 'Unknown'),
            'start_date': event.get('startDate', '2020-01-01T00:00:00Z'),
            'end_date': event.get('endDate', '2030-01-01T00:00:00Z'),
            'closed': event.get('closed', False),
            'volume': event.get('volume', 0),
            'liquidity': event.get('liquidity', 0) if event.get('liquidity') else 0,
            'open_interest': event.get('openInterest', 0),
            'icon': event.get('icon', ''),
            'image': event.get('image', ''),
            'comment_count': event.get('commentCount', 0),
            'tags': tag_labels,
            'restricted': event.get('restricted', False),
            'featured': event.get('featured', False),
        })
    
    # Batch import using UNWIND.
    with driver.session() as session:
        session.run('''
            UNWIND $events as event
            MERGE (e:Event {slug: event.slug})
            SET e.title = event.title,
                e.description = event.description,
                e.category = event.category,
                e.start_date = datetime(event.start_date),
                e.end_date = datetime(event.end_date),
                e.closed = event.closed,
                e.volume = toFloat(event.volume),
                e.liquidity = toFloat(event.liquidity),
                e.open_interest = toFloat(event.open_interest),
                e.icon = event.icon,
                e.image = event.image,
                e.comment_count = toInteger(event.comment_count),
                e.tags = event.tags,
                e.restricted = event.restricted,
                e.featured = event.featured
        ''', {'events': event_data})
    
    print(f'  ✓ Imported {len(events)} events\n')

def import_markets(driver, events):
    """Import Market nodes in batches."""
    print('[4/9] Importing markets...')
    
    # Prepare market data.
    market_data = []
    
    for event in events:
        event_slug = event.get('slug')
        
        for market in event.get('markets', []):
            condition_id = market.get('conditionId')
            if not condition_id:
                continue
            
            # Determine resolution status.
            closed = market.get('closed', False)
            uma_resolution_status = market.get('umaResolutionStatus', '')
            resolved = uma_resolution_status == 'resolved'
            winning_outcome = None
            
            if resolved:
                outcome_prices_str = market.get('outcomePrices', '[]')
                try:
                    outcome_prices = json.loads(outcome_prices_str) if isinstance(outcome_prices_str, str) else outcome_prices_str
                    outcomes_str = market.get('outcomes', '[]')
                    outcome_names = json.loads(outcomes_str) if isinstance(outcomes_str, str) else outcomes_str
                    
                    for i, price in enumerate(outcome_prices):
                        if float(price) >= 0.99:
                            winning_outcome = outcome_names[i] if i < len(outcome_names) else None
                            break
                except Exception:
                    pass
            
            # Convert closedTime format.
            closed_time = market.get('closedTime', '')
            if closed_time:
                try:
                    closed_time = closed_time.replace(' ', 'T').replace('+00', 'Z')
                except Exception:
                    closed_time = '2020-01-01T00:00:00Z'
            else:
                closed_time = '2020-01-01T00:00:00Z'
            
            market_data.append({
                'condition_id': condition_id,
                'question': market.get('question', ''),
                'slug': market.get('slug', ''),
                'description': market.get('description', ''),
                'question_id': market.get('questionID', ''),
                'start_date': market.get('startDate', '2020-01-01T00:00:00Z'),
                'end_date': market.get('endDate', '2030-01-01T00:00:00Z'),
                'closed': closed,
                'closed_time': closed_time,
                'resolved': resolved,
                'winning_outcome': winning_outcome,
                'resolved_by': market.get('resolvedBy', ''),
                'uma_resolution_status': uma_resolution_status,
                'volume': market.get('volumeNum', 0),
                'volume_clob': market.get('volumeClob', 0),
                'liquidity': market.get('liquidityNum', 0) if market.get('liquidityNum') else 0,
                'last_trade_price': market.get('lastTradePrice', 0),
                'best_ask': market.get('bestAsk', 0),
                'best_bid': market.get('bestBid', 0),
                'spread': market.get('spread', 0),
                'neg_risk': market.get('negRisk', False),
                'neg_risk_market_id': market.get('negRiskMarketID'),
                'group_item_title': market.get('groupItemTitle'),
                'group_item_threshold': market.get('groupItemThreshold'),
                'restricted': market.get('restricted', False),
                'active': market.get('active', True),
                'event_slug': event_slug,
            })
    
    # Batch import markets.
    with driver.session() as session:
        session.run('''
            UNWIND $markets as market
            MERGE (m:Market {condition_id: market.condition_id})
            SET m.question = market.question,
                m.slug = market.slug,
                m.description = market.description,
                m.question_id = market.question_id,
                m.start_date = datetime(market.start_date),
                m.end_date = datetime(market.end_date),
                m.closed = market.closed,
                m.closed_time = datetime(market.closed_time),
                m.resolved = market.resolved,
                m.winning_outcome = market.winning_outcome,
                m.resolved_by = market.resolved_by,
                m.uma_resolution_status = market.uma_resolution_status,
                m.volume = toFloat(market.volume),
                m.volume_clob = toFloat(market.volume_clob),
                m.liquidity = toFloat(market.liquidity),
                m.last_trade_price = toFloat(market.last_trade_price),
                m.best_ask = toFloat(market.best_ask),
                m.best_bid = toFloat(market.best_bid),
                m.spread = toFloat(market.spread),
                m.neg_risk = market.neg_risk,
                m.neg_risk_market_id = market.neg_risk_market_id,
                m.group_item_title = market.group_item_title,
                m.group_item_threshold = market.group_item_threshold,
                m.restricted = market.restricted,
                m.active = market.active
        ''', {'markets': market_data})
        
        # Create Market -> Event relationships.
        session.run('''
            UNWIND $markets as market
            MATCH (m:Market {condition_id: market.condition_id})
            MATCH (e:Event {slug: market.event_slug})
            MERGE (m)-[:PART_OF_EVENT]->(e)
        ''', {'markets': market_data})
    
    print(f'  ✓ Imported {len(market_data)} markets\n')

def import_outcomes(driver, events):
    """Import Outcome nodes in batches."""
    print('[5/9] Importing outcomes...')
    
    # Prepare outcome data.
    outcome_data = []
    
    for event in events:
        for market in event.get('markets', []):
            condition_id = market.get('conditionId')
            if not condition_id:
                continue
            
            # Parse outcomes.
            outcomes_str = market.get('outcomes', '[]')
            outcome_names = json.loads(outcomes_str) if isinstance(outcomes_str, str) else (outcomes_str or [])
            
            prices_str = market.get('outcomePrices', '[]')
            prices = json.loads(prices_str) if isinstance(prices_str, str) else (prices_str or [])
            
            token_ids_str = market.get('clobTokenIds', '[]')
            token_ids = json.loads(token_ids_str) if isinstance(token_ids_str, str) else (token_ids_str or [])
            
            for i, outcome_name in enumerate(outcome_names):
                outcome_data.append({
                    'condition_id': condition_id,
                    'outcome_index': i,
                    'outcome_name': outcome_name,
                    'current_price': prices[i] if i < len(prices) else 0.5,
                    'token_id': token_ids[i] if i < len(token_ids) else '',
                })
    
    # Batch import outcomes.
    with driver.session() as session:
        session.run('''
            UNWIND $outcomes as outcome
            MERGE (o:Outcome {condition_id: outcome.condition_id, outcome_index: outcome.outcome_index})
            SET o.outcome_name = outcome.outcome_name,
                o.current_price = toFloat(outcome.current_price),
                o.token_id = outcome.token_id
        ''', {'outcomes': outcome_data})
        
        # Create Market -> Outcome relationships.
        session.run('''
            UNWIND $outcomes as outcome
            MATCH (o:Outcome {condition_id: outcome.condition_id, outcome_index: outcome.outcome_index})
            MATCH (m:Market {condition_id: outcome.condition_id})
            MERGE (m)-[:HAS_OUTCOME]->(o)
        ''', {'outcomes': outcome_data})
    
    print(f'  ✓ Imported {len(outcome_data)} outcomes\n')

def import_users(driver, users):
    """Import User nodes with Polymarket profile data."""
    print('[6/9] Importing users...')
    
    # Prepare user data.
    user_data = []
    for user in users.values():
        user_data.append({
            'address': user['address'],
            'role': 'trader',
            'name': user.get('name', ''),
            'pseudonym': user.get('pseudonym', ''),
            'bio': user.get('bio', ''),
            'profile_image': user.get('profile_image', ''),
            'profile_image_optimized': user.get('profile_image_optimized', ''),
        })
    
    # Batch import users.
    with driver.session() as session:
        session.run('''
            UNWIND $users as user
            MERGE (u:User {address: user.address})
            SET u.role = user.role,
                u.name = user.name,
                u.pseudonym = user.pseudonym,
                u.bio = user.bio,
                u.profile_image = user.profile_image,
                u.profile_image_optimized = user.profile_image_optimized
        ''', {'users': user_data})
    
    print(f'  ✓ Imported {len(users)} users\n')

def import_trades(driver, trades):
    """Import Trade nodes in batches for speed."""
    print('[7/9] Importing trades...')
    
    batch_size = 500  # Process 500 trades at a time
    total_batches = (len(trades) + batch_size - 1) // batch_size
    
    imported_count = 0
    skipped_count = 0
    
    with driver.session() as session:
        for batch_idx in tqdm(range(0, len(trades), batch_size), desc='  Trade Batches', unit='batch', total=total_batches):
            batch = trades[batch_idx:batch_idx + batch_size]
            
            # Prepare batch data.
            trade_data = []
            for trade in batch:
                tx_hash = trade.get('hash')
                condition_id = trade.get('condition_id')
                trader_address = trade.get('from')
                
                if not tx_hash or not condition_id or not trader_address:
                    skipped_count += 1
                    continue
                
                # Parse timestamp.
                timestamp_value = trade.get('timestamp')
                if timestamp_value:
                    try:
                        timestamp_iso = datetime.fromtimestamp(int(timestamp_value)).isoformat()
                    except Exception:
                        timestamp_iso = datetime.now().isoformat()
                else:
                    timestamp_iso = datetime.now().isoformat()
                
                trade_data.append({
                    'transaction_hash': tx_hash,
                    'timestamp': timestamp_iso,
                    'side': trade.get('side', 'BUY'),
                    'size_usdc': trade.get('size', 0),
                    'price': trade.get('price', 0),
                    'outcome_name': trade.get('outcome', ''),
                    'outcome_index': trade.get('outcome_index', 0),
                    'market_title': trade.get('market_title', ''),
                    'market_slug': trade.get('market_slug', ''),
                    'event_slug': trade.get('event_slug', ''),
                    'trader_address': trader_address,
                    'condition_id': condition_id,
                })
            
            if not trade_data:
                continue
            
            # Batch import trades.
            session.run('''
                UNWIND $trades as trade
                MERGE (t:Trade {transaction_hash: trade.transaction_hash})
                SET t.timestamp = datetime(trade.timestamp),
                    t.side = trade.side,
                    t.size_usdc = toFloat(trade.size_usdc),
                    t.price = toFloat(trade.price),
                    t.outcome_name = trade.outcome_name,
                    t.outcome_index = toInteger(trade.outcome_index),
                    t.market_title = trade.market_title,
                    t.market_slug = trade.market_slug,
                    t.event_slug = trade.event_slug
            ''', {'trades': trade_data})
            
            # Batch create User->Trade relationships.
            session.run('''
                UNWIND $trades as trade
                MATCH (t:Trade {transaction_hash: trade.transaction_hash})
                MATCH (u:User {address: trade.trader_address})
                MERGE (u)-[:PLACED_TRADE]->(t)
            ''', {'trades': trade_data})
            
            # Batch create Trade->Market relationships.
            session.run('''
                UNWIND $trades as trade
                MATCH (t:Trade {transaction_hash: trade.transaction_hash})
                MATCH (m:Market {condition_id: trade.condition_id})
                MERGE (t)-[:ON_MARKET]->(m)
            ''', {'trades': trade_data})
            
            # Batch create Trade->Outcome relationships.
            session.run('''
                UNWIND $trades as trade
                MATCH (t:Trade {transaction_hash: trade.transaction_hash})
                MATCH (o:Outcome {condition_id: trade.condition_id, outcome_index: trade.outcome_index})
                MERGE (t)-[:FOR_OUTCOME]->(o)
            ''', {'trades': trade_data})
            
            imported_count += len(trade_data)
    
    print(f'  ✓ Imported {imported_count} trades ({skipped_count} skipped)\n')

def create_group_market_relationships(driver, events):
    """Link markets in the same group."""
    print('[8/9] Creating group market relationships...')
    
    count = 0
    
    with driver.session() as session:
        for event in events:
            for market in event.get('markets', []):
                neg_risk_market_id = market.get('negRiskMarketID')
                condition_id = market.get('conditionId')
                
                if neg_risk_market_id and condition_id:
                    session.run('''
                        MATCH (m1:Market {condition_id: $condition_id})
                        MATCH (m2:Market)
                        WHERE m2.neg_risk_market_id = $neg_risk_market_id
                          AND m1.condition_id <> m2.condition_id
                        MERGE (m1)-[:SAME_GROUP {group_id: $neg_risk_market_id}]->(m2)
                    ''', {
                        'condition_id': condition_id,
                        'neg_risk_market_id': neg_risk_market_id,
                    })
                    count += 1
    
    print(f'  ✓ Created relationships for {count} group markets\n')

def create_holdings(driver):
    """Calculate user holdings from BUY trades."""
    print('[9/9] Creating holdings...')
    
    with driver.session() as session:
        result = session.run('''
            MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)-[:FOR_OUTCOME]->(o:Outcome)
            WHERE t.side = 'BUY'
            WITH u, o, sum(t.size_usdc) as total_invested, max(t.timestamp) as last_trade
            MERGE (u)-[h:HOLDS]->(o)
            SET h.invested_usdc = total_invested,
                h.last_updated = last_trade
            RETURN count(*) as holdings_created
        ''')
        
        count = result.single()['holdings_created']
    
    print(f'  ✓ Created {count} holdings\n')

# Main execution.
print('Starting Neo4j import...\n')

create_schema(neo4j_driver)
clear_database(neo4j_driver)
import_events(neo4j_driver, latest_events)
import_markets(neo4j_driver, latest_events)
import_outcomes(neo4j_driver, latest_events)
import_users(neo4j_driver, user_profiles)
import_trades(neo4j_driver, all_token_transfers)
create_group_market_relationships(neo4j_driver, latest_events)
create_holdings(neo4j_driver)

print('=' * 70)
print('✅ Data import complete!')
print('=' * 70)
print()
print('Summary:')
print(f'  • Events: {len(latest_events)}')
print(f'  • Markets: {total_markets}')
print(f'  • Outcomes: {len(all_outcomes)}')
print(f'  • Trades: {len(all_token_transfers)}')
print(f'  • Users: {len(user_profiles)}')
print('=' * 70)
