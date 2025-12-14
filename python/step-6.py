def fetch_trades_from_data_api(condition_ids: List[str] = None, max_trades: int = None, batch_desc: str = '') -> List[Dict[str, Any]]:
    """Fetch ALL trades from Polymarket Data API with pagination."""
    import time as time_module
    from tqdm.notebook import tqdm
    
    url = 'https://data-api.polymarket.com/trades'
    all_trades = []
    offset = 0
    page_size = 500  # Polymarket API hard limit is 500 per request
    
    # Create a progress bar without a known total (will just count up)
    pbar = tqdm(total=None, desc=f'{batch_desc}', unit=' trades', position=1, leave=False, bar_format='{desc}: {n_fmt} trades fetched')
    
    try:
        while True:
            params = {
                'limit': page_size,
                'offset': offset,
                'takerOnly': 'true'
            }
            
            # Add market filter if condition IDs provided.
            if condition_ids:
                params['market'] = ','.join(condition_ids)
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                pbar.write(f'    ⚠ Error: HTTP {response.status_code}')
                break
            
            trades = response.json()
            
            if len(trades) == 0:
                break
            
            # Transform to our format and extract ALL data from Polymarket API.
            for trade in trades:
                all_trades.append({
                    'hash': trade.get('transactionHash', ''),
                    'from': trade.get('proxyWallet', ''),
                    'to': '',
                    'side': trade.get('side', ''),
                    'condition_id': trade.get('conditionId', ''),
                    'outcome': trade.get('outcome', ''),
                    'outcome_index': trade.get('outcomeIndex', 0),
                    'size': float(trade.get('size', 0)),
                    'price': float(trade.get('price', 0)),
                    'timestamp': trade.get('timestamp', 0),
                    'asset': trade.get('asset', ''),
                    'market_slug': trade.get('slug', ''),
                    'market_title': trade.get('title', ''),
                    'market_icon': trade.get('icon', ''),
                    'event_slug': trade.get('eventSlug', ''),
                    'user_name': trade.get('name', ''),
                    'user_pseudonym': trade.get('pseudonym', ''),
                    'user_bio': trade.get('bio', ''),
                    'user_profile_image': trade.get('profileImage', ''),
                    'user_profile_image_optimized': trade.get('profileImageOptimized', ''),
                })
            
            # Update progress bar with new trade count
            pbar.n = len(all_trades)
            pbar.refresh()
            
            # Check if we've reached the max trades limit.
            if max_trades and len(all_trades) >= max_trades:
                all_trades = all_trades[:max_trades]
                pbar.write(f'    ℹ Reached limit of {max_trades:,} trades for this batch')
                break
            
            # Check if we got fewer trades than the page size (end of data).
            if len(trades) < page_size:
                break
            
            # Move to next page.
            offset += len(trades)
            
            # Rate limiting to avoid hitting API limits.
            time_module.sleep(0.3)
        
        pbar.close()
        return all_trades
    
    except Exception as e:
        pbar.close()
        print(f'    ⚠ Error: {e}')
        return all_trades

from tqdm.notebook import tqdm

print('Fetching ALL trades from Polymarket Data API...')
print(f'Strategy: Fetch trades per market individually (max 2,000 trades per market)\n')

# Fetch trades per market individually to ensure fair distribution
condition_id_list = list(all_condition_ids)
all_token_transfers = []

print(f'Total markets: {len(condition_id_list)}')
print(f'Limit: 2,000 trades per market (to prevent single active markets from dominating)\n')

# Create progress bar for markets
for i, condition_id in enumerate(tqdm(condition_id_list, desc='Fetching Markets', unit='market', position=0)):
    market_desc = f'Market {i+1}/{len(condition_id_list)}'
    
    # Fetch trades for single market with 2,000 trade limit
    trades = fetch_trades_from_data_api(condition_ids=[condition_id], max_trades=2000, batch_desc=market_desc)
    all_token_transfers.extend(trades)

print(f'\n✅ Completed!')

print(f'\n📊 Total: Fetched {len(all_token_transfers)} trades\n')

if len(all_token_transfers) > 0:
    # Get unique condition IDs from trades.
    fetched_condition_ids = set(t['condition_id'] for t in all_token_transfers if t['condition_id'])
    
    # Get unique users.
    users = set(t['from'] for t in all_token_transfers if t['from'])
    
    # Calculate total volume.
    total_volume = sum(t['size'] for t in all_token_transfers)
    
    print(f'📊 Trade Statistics:')
    print(f'─' * 70)
    print(f'  Total Trades:         {len(all_token_transfers):,}')
    print(f'  Markets Requested:    {len(all_condition_ids)}')
    print(f'  Markets with Trades:  {len(fetched_condition_ids)}')
    print(f'  Unique Users:         {len(users):,}')
    print(f'  Total Volume:         ${total_volume:,.2f} USDC')
    if len(all_token_transfers) > 0:
        print(f'  Average Trade Size:   ${total_volume / len(all_token_transfers):,.2f} USDC')
    print(f'─' * 70)
    
    # Check for markets with no trades
    missing_condition_ids = all_condition_ids - fetched_condition_ids
    if len(missing_condition_ids) > 0:
        print(f'\n⚠️  Warning: {len(missing_condition_ids)} markets returned NO trades:')
        print(f'   This could mean:')
        print(f'   • Markets are too old (API might not have historical data)')
        print(f'   • Markets had no trading activity')
        print(f'   • API filtering issue with those condition IDs')
        print(f'\n   Missing condition IDs (first 5):')
        for cid in list(missing_condition_ids)[:5]:
            print(f'   • {cid}')
        if len(missing_condition_ids) > 5:
            print(f'   ... and {len(missing_condition_ids) - 5} more')
    
    print(f'\n✅ Successfully collected {len(all_token_transfers):,} trades for our markets!')
else:
    print('\n⚠️  WARNING: No trades fetched!')
    print('    Possible reasons:')
    print('    - Markets are too new/old')
    print('    - API filter syntax issue')
    print('    - Markets have no trading activity')
