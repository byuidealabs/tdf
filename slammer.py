# Designed to load test a TDF instance running on the localhost, port 3000
import requests
import time

tick = 'http://localhost:3000/maketick'
allagents = 'http://localhost:3000/agents/'

if __name__ == '__main__':
    print 'Starting Slammer'
    numticks = 1
    while (True):
        start = time.time()
        print 'Ticking %i' % numticks
        #requests.get(tick)

        print '\tTicked in %.4f seconds' % (time.time() - start)
        numticks += 1

        start = time.time()
        requests.get(allagents)
        print '\tLoaded all agents in %.4f seconds' % (time.time() - start)
