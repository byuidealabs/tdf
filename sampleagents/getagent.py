import requests

SITE = 'http://localhost:3000/agents/trade/'
AGENT_ID = '52a1215e3106ecc0380046e1'
API_KEY = 'xvvfrsuqihkgckkodfuakudqlqurwabp'


if __name__ == '__main__':

    # Working buy
    buy = '?apikey=' + API_KEY + '&GOOG=10'
    r = requests.get(SITE + AGENT_ID + buy)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Working sell

    sell = '?apikey=' + API_KEY + '&GOOG=-5'
    r = requests.get(SITE + AGENT_ID + sell)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Compound trade

    comp = '?apikey=' + API_KEY + '&NFLX=13&AAPL=7&GOOG=-5'
    r = requests.get(SITE + AGENT_ID + comp)
    assert (r.status_code == 200 and 'portfolio' in r.json())

    # Bring back to zero securities
    zero = '?apikey=' + API_KEY + '&NFLX=-13&AAPL=-7'
    r = requests.get(SITE + AGENT_ID + zero)
    assert (r.status_code == 200 and 'portfolio' in r.json())
