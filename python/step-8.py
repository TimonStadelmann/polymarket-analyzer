from tqdm.notebook import tqdm

print('=' * 70)
print('Verifying Neo4j Database')
print('=' * 70)
print()

def verify_database(driver):
    """Run comprehensive verification queries."""
    
    with driver.session() as session:
        # ====================================================================
        # 1. NODE COUNTS
        # ====================================================================
        print('[1/7] Counting Nodes...')
        print('-' * 70)
        
        node_types = ['Event', 'Market', 'Outcome', 'User', 'Contract', 'Trade']
        node_counts = {}
        
        for node_type in tqdm(node_types, desc='Node Types'):
            result = session.run(f'MATCH (n:{node_type}) RETURN count(n) as count')
            node_counts[node_type] = result.single()['count']
            print(f'  • {node_type}: {node_counts[node_type]:,}')
        
        # Specific counts.
        result = session.run('MATCH (u:User) WHERE u.role = "trader" RETURN count(u) as count')
        trader_count = result.single()['count']
        print(f'  • Traders (subset of Users): {trader_count:,}')
        
        print()
        
        # ====================================================================
        # 2. RELATIONSHIP COUNTS
        # ====================================================================
        print('[2/7] Counting Relationships...')
        print('-' * 70)
        
        result = session.run('''
            MATCH ()-[r]->()
            RETURN type(r) as rel_type, count(r) as count
            ORDER BY count DESC
        ''')
        
        rel_data = list(result)
        for record in tqdm(rel_data, desc='Relationship Types'):
            print(f'  • {record["rel_type"]}: {record["count"]:,}')
        
        total_rels = sum(r['count'] for r in rel_data)
        print(f'\n  Total Relationships: {total_rels:,}')
        print()
        
        # ====================================================================
        # 3. DATA QUALITY CHECKS
        # ====================================================================
        print('[3/7] Data Quality Checks...')
        print('-' * 70)
        
        checks = [
            ('Events without Markets', 'MATCH (e:Event) WHERE NOT (e)<-[:PART_OF_EVENT]-() RETURN count(e) as count'),
            ('Markets without Events', 'MATCH (m:Market) WHERE NOT (m)-[:PART_OF_EVENT]->() RETURN count(m) as count'),
            ('Markets without Outcomes', 'MATCH (m:Market) WHERE NOT (m)-[:HAS_OUTCOME]->() RETURN count(m) as count'),
            ('Trades without Users', 'MATCH (t:Trade) WHERE NOT ()-[:PLACED_TRADE]->(t) RETURN count(t) as count'),
            ('Trades without Markets', 'MATCH (t:Trade) WHERE NOT (t)-[:ON_MARKET]->() RETURN count(t) as count'),
            ('Users without Trades', 'MATCH (u:User {role: "trader"}) WHERE NOT (u)-[:PLACED_TRADE]->() RETURN count(u) as count'),
        ]
        
        all_checks_passed = True
        for check_name, query in tqdm(checks, desc='Quality Checks'):
            result = session.run(query)
            count = result.single()['count']
            status = '✅' if count == 0 else '⚠️'
            print(f'  {status} {check_name}: {count}')
            if count > 0:
                all_checks_passed = False
        
        if all_checks_passed:
            print('\n  ✅ All quality checks passed!')
        else:
            print('\n  ⚠️  Some quality issues detected (see above)')
        print()
        
        # ====================================================================
        # 4. MARKET RESOLUTION STATUS
        # ====================================================================
        print('[4/7] Market Resolution Analysis...')
        print('-' * 70)
        
        result = session.run('''
            MATCH (m:Market)
            RETURN 
                sum(CASE WHEN m.resolved = true THEN 1 ELSE 0 END) as resolved_count,
                sum(CASE WHEN m.closed = true THEN 1 ELSE 0 END) as closed_count,
                sum(CASE WHEN m.active = true THEN 1 ELSE 0 END) as active_count,
                count(m) as total_count
        ''')
        
        record = result.single()
        print(f'  • Resolved Markets: {record["resolved_count"]:,} ({record["resolved_count"]/record["total_count"]*100:.1f}%)')
        print(f'  • Closed Markets: {record["closed_count"]:,} ({record["closed_count"]/record["total_count"]*100:.1f}%)')
        print(f'  • Active Markets: {record["active_count"]:,} ({record["active_count"]/record["total_count"]*100:.1f}%)')
        print(f'  • Total Markets: {record["total_count"]:,}')
        
        # Show resolved markets with winners.
        print('\n  Sample Resolved Markets:')
        result = session.run('''
            MATCH (m:Market)
            WHERE m.resolved = true AND m.winning_outcome IS NOT NULL
            RETURN m.question as question, m.winning_outcome as winner, m.volume as volume
            ORDER BY m.volume DESC
            LIMIT 3
        ''')
        
        for record in result:
            print(f'    • "{record["question"][:50]}..."')
            print(f'      Winner: {record["winner"]} | Volume: ${record["volume"]:,.2f}')
        print()
        
        # ====================================================================
        # 5. TRADING VOLUME ANALYSIS
        # ====================================================================
        print('[5/7] Trading Volume Analysis...')
        print('-' * 70)
        
        result = session.run('''
            MATCH (t:Trade)
            RETURN 
                sum(t.size_usdc) as total_volume,
                avg(t.size_usdc) as avg_trade_size,
                min(t.size_usdc) as min_trade,
                max(t.size_usdc) as max_trade,
                count(t) as trade_count
        ''')
        
        record = result.single()
        print(f'  • Total Volume: ${record["total_volume"]:,.2f} USDC')
        print(f'  • Average Trade Size: ${record["avg_trade_size"]:,.2f} USDC')
        print(f'  • Smallest Trade: ${record["min_trade"]:,.2f} USDC')
        print(f'  • Largest Trade: ${record["max_trade"]:,.2f} USDC')
        print(f'  • Total Trades: {record["trade_count"]:,}')
        
        # BUY vs SELL ratio.
        result = session.run('''
            MATCH (t:Trade)
            RETURN 
                t.side as side,
                count(t) as count,
                sum(t.size_usdc) as volume
            ORDER BY count DESC
        ''')
        
        print('\n  Trade Side Distribution:')
        for record in result:
            print(f'    • {record["side"]}: {record["count"]:,} trades (${record["volume"]:,.2f})')
        print()
        
        # ====================================================================
        # 6. TOP PERFORMERS
        # ====================================================================
        print('[6/7] Top Performers...')
        print('-' * 70)
        
        # Top traders by volume.
        print('  Top 5 Traders by Volume:')
        result = session.run('''
            MATCH (u:User)-[:PLACED_TRADE]->(t:Trade)
            WITH u, sum(t.size_usdc) as total_volume, count(t) as trade_count
            RETURN u.address as trader, total_volume, trade_count
            ORDER BY total_volume DESC
            LIMIT 5
        ''')
        
        for idx, record in enumerate(result, 1):
            print(f'    {idx}. {record["trader"][:20]}...')
            print(f'       Volume: ${record["total_volume"]:,.2f} | Trades: {record["trade_count"]}')
        
        # Top markets by volume.
        print('\n  Top 5 Markets by Volume:')
        result = session.run('''
            MATCH (m:Market)
            RETURN m.question as question, m.volume as volume, m.slug as slug
            ORDER BY m.volume DESC
            LIMIT 5
        ''')
        
        for idx, record in enumerate(result, 1):
            print(f'    {idx}. {record["question"][:50]}...')
            print(f'       Volume: ${record["volume"]:,.2f}')
        
        # Top events by volume.
        print('\n  Top 5 Events by Volume:')
        result = session.run('''
            MATCH (e:Event)
            RETURN e.title as title, e.volume as volume, e.category as category
            ORDER BY e.volume DESC
            LIMIT 5
        ''')
        
        for idx, record in enumerate(result, 1):
            print(f'    {idx}. {record["title"][:40]}...')
            print(f'       Category: {record["category"]} | Volume: ${record["volume"]:,.2f}')
        print()
        
        # ====================================================================
        # 7. SAMPLE GRAPH PATHS
        # ====================================================================
        print('[7/7] Sample Graph Paths...')
        print('-' * 70)
        
        # User → Trade → Market → Event path.
        print('  Path: User → Trade → Market → Event')
        result = session.run('''
            MATCH path = (u:User)-[:PLACED_TRADE]->(t:Trade)
                         -[:ON_MARKET]->(m:Market)-[:PART_OF_EVENT]->(e:Event)
            RETURN u.address as user, t.side as side, t.size_usdc as size,
                   t.price as price, m.question as market, e.title as event
            LIMIT 3
        ''')
        
        for record in result:
            print(f'    • User: {record["user"][:20]}...')
            print(f'      Trade: {record["side"]} ${record["size"]:.2f} @ {record["price"]:.3f}')
            print(f'      Market: "{record["market"][:40]}..."')
            print(f'      Event: "{record["event"][:40]}..."')
            print()
        
        # Group markets.
        print('  Group Markets (SAME_GROUP):')
        result = session.run('''
            MATCH (m1:Market)-[r:SAME_GROUP]->(m2:Market)
            WITH r.group_id as group_id, collect(DISTINCT m1.group_item_title)[0..3] as sample_options
            RETURN group_id, sample_options, size(sample_options) as option_count
            LIMIT 2
        ''')
        
        for record in result:
            print(f'    • Group: {record["group_id"][:25]}...')
            print(f'      Options: {", ".join(record["sample_options"])}')
            print()

# Run verification.
verify_database(neo4j_driver)

print('=' * 70)
print('✅ Database Verification Complete!')
print('=' * 70)
