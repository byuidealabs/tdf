import requests
#import json

SITE = 'http://localhost:3000/agents/trade/'
AGENT_ID = '529f909fe5a69fcd4c0001fd'
API_KEY = 'ykuffmwbfmefulrbfycnaigyyhqxjlue'


if __name__ == '__main__':

    # Working buy

    buy = {
        'GOOG': 10,
        'apikey': API_KEY
    }

    r = requests.post(SITE + AGENT_ID, buy)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Working sell

    sell = {
        'GOOG': -5,
        'apikey': API_KEY
    }

    r = requests.post(SITE + AGENT_ID, sell)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Compound trade

    comp = {
        'NFLX': 13,
        'AAPL': 7,
        'GOOG': -5,
        'apikey': API_KEY
    }

    r = requests.post(SITE + AGENT_ID, comp)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Bring back to zero securities
    zero = {
        'NFLX': -13,
        'AAPL': -7,
        'apikey': API_KEY
    }

    r = requests.post(SITE + AGENT_ID, zero)
    assert (r.status_code == 200 and 'portfolio' in r.json())
