import requests
import json

HEADERS = {'Content-Type': 'application/json'}
SITE = 'http://localhost:3000/agents/trade/'
AGENT_ID = '5273f50b32f8b64b1d000005'
OTHER_ID = '5273de8e68060d0f10000006'
BOGUS_ID = '012345678900000000000000'

API_KEY = 'ponweyqvgqbyonttkffyllubodaidawg'


if __name__ == '__main__':
    # Set up http connection

    # Create trade 1: buy 100 shares GOOG
    buy = {
        'buy': [{'s': 'GOOG', 'q': 100}],
        'sell': []
    }

    r = requests.put(SITE + AGENT_ID, data=json.dumps(buy), headers=HEADERS)
    assert ('cash' in r.text)  # All executed properly
