def fetch_latest_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch the latest active events from Polymarket Gamma API."""
    try:
        url = f'{GAMMA_API_BASE}/events'
        params = {
            'limit': limit,
            'offset': 0,
            'closed': 'true',
            'order': 'id',
            'ascending': 'false'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
    
    except Exception as e:
        print(f'Error fetching events: {e}')
        return []

# Fetch events (including closed ones since token transfers are historical).
latest_events = fetch_latest_events(150)
total_markets = sum(len(event.get('markets', [])) for event in latest_events)

print(f'Fetched {len(latest_events)} events and {total_markets} markets (including closed events for historical trades)')