import json

def extract_category_from_tags(event: Dict[str, Any]) -> str:
    """Extract category from event tags."""
    if event.get('category'):
        return event['category']
    
    tags = event.get('tags', [])
    priority_categories = ['Sports', 'Politics', 'Finance', 'Crypto', 'Science', 'Entertainment']
    
    for tag in tags:
        label = tag.get('label', '')
        if label in priority_categories:
            return label
    
    for tag in tags:
        label = tag.get('label', '')
        if label and label not in ['All', 'Hide From New', 'Daily', 'Recurring']:
            return label
    
    return 'Unknown'

def extract_outcomes_from_market(market: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract outcomes with token IDs and prices from market."""
    outcomes_str = market.get('outcomes', '[]')
    outcome_names = json.loads(outcomes_str) if isinstance(outcomes_str, str) else (outcomes_str or [])
    
    prices_str = market.get('outcomePrices', '[]')
    prices = json.loads(prices_str) if isinstance(prices_str, str) else (prices_str or [])
    
    token_ids_str = market.get('clobTokenIds', '[]')
    token_ids = json.loads(token_ids_str) if isinstance(token_ids_str, str) else (token_ids_str or [])
    
    outcomes = []
    for i, outcome_name in enumerate(outcome_names):
        outcomes.append({
            'token_id': token_ids[i] if i < len(token_ids) else f"unknown_{market['id']}_{i}",
            'name': outcome_name,  # Changed from 'outcome_name' to 'name'
            'price': prices[i] if i < len(prices) else '0.5',  # Changed from 'current_price' to 'price'
            'condition_id': market.get('conditionId'),  # Added for linking trades to markets
        })
    
    return outcomes

# Process events.
print('Processing events...')
for event in latest_events:
    event['category'] = extract_category_from_tags(event)

categories = set(event['category'] for event in latest_events)
print(f'  Categories: {", ".join(categories)}')

# Extract outcomes.
print('Extracting outcomes and condition IDs...')
all_outcomes = []
all_condition_ids = set()

for event in latest_events:
    for market in event.get('markets', []):
        outcomes = extract_outcomes_from_market(market)
        all_outcomes.extend(outcomes)
        
        # Collect condition IDs for trade filtering.
        condition_id = market.get('conditionId')
        if condition_id:
            all_condition_ids.add(condition_id)

print(f'  Outcomes: {len(all_outcomes)} (from {total_markets} markets)')
print(f'  Unique Condition IDs: {len(all_condition_ids)}')

# Collect all token IDs for later (not used for blockchain matching anymore).
outcome_token_ids = set(outcome['token_id'] for outcome in all_outcomes if not outcome['token_id'].startswith('unknown_'))
print(f'  Valid Token IDs: {len(outcome_token_ids)}')

# USDC address.
usdc_address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

print('\n✅ Polymarket data processed')