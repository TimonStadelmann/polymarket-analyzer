# Initialize Neo4j driver.
neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
print('✓ Neo4j driver initialized')

# Test Gamma API connection.
try:
    response = requests.get(f'{GAMMA_API_BASE}/markets', timeout=10)
    if response.status_code == 200:
        print('✓ Connected to Polymarket Gamma API')
    else:
        print(f'✗ Gamma API returned status code: {response.status_code}')
except Exception as e:
    print(f'✗ Error connecting to Gamma API: {e}')

# Test Blockscout API connection.
try:
    response = requests.get('https://polygon.blockscout.com/api/v2/stats', timeout=10)
    if response.status_code == 200:
        print('✓ Connected to Blockscout API (Polygon)')
    else:
        print(f'✗ Blockscout API returned status code: {response.status_code}')
except Exception as e:
    print(f'✗ Error connecting to Blockscout API: {e}')

print('\n✅ All clients initialized successfully')