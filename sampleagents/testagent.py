import requests
import json

HEADERS = {'Content-Type': 'application/json'}
SITE = 'http://localhost:3000/agents/trade/'
# AGENT_ID = '52741243e93c0ce429000003'             # Lab Agent
AGENT_ID = '527e640b6f8aaab26a000002'               # Personal Agent
OTHER_ID = '5277c1ccb33812240e000003'
BOGUS_ID = '012345678900000000000000'

# API_KEY = 'ponweyqvgqbyonttkffyllubodaidawg'      # Lab Agent
API_KEY = 'mosxwaqxrutualrdaoyrdgwrtdyksuhv'        # Personal Agent
ALT_KEY = 'mnvanhaajotdowwcdrqfcwujolajchct'

# USER ACCOUNT:
# email: test2@gmail.com
# pswrd: test-2
#
# RECOMMENDED:
# Log in to the account on the web and reset the trades on this agent before
# running these tests (tests not guaranteed to work otherwise).
#
# Run the tests twice--once while logged in and once while logged out
# in the web interface


if __name__ == '__main__':
    # Set up http connection

    #-------------------------------
    #   Working Buy
    #-------------------------------

    # Create trade 1: buy 100 shares GOOG
    buy = {
        'buy': [{'s': 'GOOG', 'q': 10}],
        'sell': [],
        'apikey': API_KEY
    }

    r = requests.put(SITE + AGENT_ID, data=json.dumps(buy), headers=HEADERS)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    #-------------------------------
    #   Working Sell
    #-------------------------------

    sell = {
        'buy': [],
        'sell': [{'s': 'GOOG', 'q': 5}],
        'apikey': API_KEY
    }

    r = requests.put(SITE + AGENT_ID, data=json.dumps(sell), headers=HEADERS)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    #-------------------------------
    #   Compound Trade
    #-------------------------------

    comp = {
        'buy': [{'s': 'NFLX', 'q': 13}, {'s': 'AAPL', 'q': 7}],
        'sell': [{'s': 'GOOG', 'q': 5}],
        'apikey': API_KEY
    }

    r = requests.put(SITE + AGENT_ID, data=json.dumps(comp), headers=HEADERS)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    #-------------------------------
    #   Oversell a security
    #-------------------------------

    #more = {
    #    'buy': [],
    #    'sell': [{'s': 'AAPL', 'q': 200}],
    #    'apikey': API_KEY
    #}

    #r = requests.put(SITE + AGENT_ID, data=json.dumps(more), headers=HEADERS)
    #assert (r.status_code == 200 and 'error' in r.json() and
    #        r.json()['error']['code'] == 2)

    #-------------------------------
    #   Sell a security that does not own
    #-------------------------------

    #nown = {
    #    'buy': [],
    #    'sell': [{'s': 'MSFT', 'q': 100}],
    #    'apikey': API_KEY
    #}
    #r = requests.put(SITE + AGENT_ID, data=json.dumps(nown), headers=HEADERS)
    #assert (r.status_code == 200 and 'error' in r.json() and
    #        r.json()['error']['code'] == 1)

    #-------------------------------
    #   Buy requires more cash than owns
    #-------------------------------

    #cash = {
    #    'buy': [{'s': 'GOOG', 'q': 9999999}],
    #    'sell': [],
    #    'apikey': API_KEY
    #}
    #r = requests.put(SITE + AGENT_ID, data=json.dumps(cash), headers=HEADERS)
    #assert (r.status_code == 200 and 'error' in r.json() and
    #        r.json()['error']['code'] == 3)

    #-------------------------------
    #   Buy a security that does not exist
    #-------------------------------

    nexs = {
        'buy': [{'s': 'notasymbol', 'q': 100}],
        'sell': [],
        'apikey': API_KEY
    }
    r = requests.put(SITE + AGENT_ID, data=json.dumps(nexs), headers=HEADERS)
    assert (r.status_code == 200 and 'error' in r.json() and
            r.json()['error']['code'] == 2)

    #-------------------------------
    #   Buy cash (an actual symbol)
    #-------------------------------

    buyc = {
        'buy': [{'s': 'cash', 'q': 100}],
        'sell': [],
        'apikey': API_KEY
    }
    r = requests.put(SITE + AGENT_ID, data=json.dumps(buyc), headers=HEADERS)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    #-------------------------------
    #   Bad API Key
    #-------------------------------

    badkey = {
        'buy': [{'s': 'GOOG', 'q': 100}],
        'sell':  [],
        'apikey': 'thisisabogusapikeythatwontwork00'
    }
    r = requests.put(SITE + AGENT_ID, data=json.dumps(badkey), headers=HEADERS)
    assert (r.status_code == 401)

    #-------------------------------
    #   Another agent owned by me
    #-------------------------------

    # Note, test this when logged in as test2 through the web to get a full
    # test.

    alt = {
        'buy': [{'s': 'GOOG', 'q': 100}],
        'sell': [],
        'apikey': ALT_KEY
    }
    r = requests.put(SITE + AGENT_ID, data=json.dumps(alt), headers=HEADERS)
    assert (r.status_code == 401)

    #-------------------------------
    #   Sell all
    #-------------------------------

    sall = {
        'buy': [],
        'sell': [{'s': 'AAPL', 'q': 7}, {'s': 'NFLX', 'q': 13},
                 {'s': 'CASH', 'q': 100}],
        'apikey': API_KEY
    }
    r = requests.put(SITE + AGENT_ID, data=json.dumps(sall), headers=HEADERS)
    assert (r.status_code == 200 and 'portfolio' in r.json())
