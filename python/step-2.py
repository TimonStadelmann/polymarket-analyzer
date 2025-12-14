import json
import time
from google.colab import userdata
from neo4j import GraphDatabase
import requests
from datetime import datetime
from typing import List, Dict, Any

# Neo4j credentials.
NEO4J_URI = userdata.get('NEO4J_URI')
NEO4J_USER = userdata.get('NEO4J_USER')
NEO4J_PASSWORD = userdata.get('NEO4J_PASSWORD')

# Polymarket Gamma API.
GAMMA_API_BASE = 'https://gamma-api.polymarket.com'

print('Configuration loaded successfully')