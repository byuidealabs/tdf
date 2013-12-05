# TDF - Tour de Finance

A paper-trading system for use in studying controls applied to finance.

Note that installation has only been tested using Ubuntu 13.10 and that the web client has only been tested in Chromium.

## Installation

### Step 1: Install node.js

Follow the instructions [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). For Ubuntu (recommended):

	sudo apt-get update
	sudo apt-get install python-software-properties python g++ make
	sudo add-apt-repository ppa:chris-lea/node.js
	sudo apt-get update
	sudo apt-get install nodejs
	
### Step 2: Install Grunt and Bower

Install both grunt, the grunt client, and bower globally by:

	sudo npm install -g grunt grunt-cli bower

### Step 3: Install and start MongoDB

Follow the instructions [here](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/). In brief:

	sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
	echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
	sudo apt-get update
	sudo apt-get install mongodb-10gen
	
Once MongoDB is installed, start it by:

	sudo service mongodb start
	
You can stop MongoDB by:

	sudo service mongodb stop
	
You can also restart MongoDB by:

	sudo service mongodb restart
	
### Step 4: Install Project Dependencies

Follow the directions [here](https://github.com/ekalinin/nodeenv/issues/24) to enable npm to install packages locally. In brief:

	sudo chown -fR myusername:myusername ~/.npm ~/tmp
	
Navigate to the tdf directory and execute the following commands:

	npm install
	
Note, you should never need to do a `sudo npm install`.
	
If you get a git error 128, you may need to switch the url protocol to https:// (instead of git://). To do this:

	git config --global url."https://".insteadOf git://
	
### Step 5: Run the Grunt Server

In the tdf directory, start the grunt server by:

	grunt
	
If everything is installed properly, you will get a message stating that the server is running on port 3000. Navigate to [localhost:3000](http://localhost:3000) to access TDF.

## Back-end Trading

To make a trade on the backend, you must first create an agent through the web client. To do this:

1.  Login or register with the site
2.  Click on the 'My Agents' link in the top navigation bar
3.  Above the desired league, click on the 'Create an Agent' button

Once you have created the agent, navigate to the agent's view if you are not there already (after creating an agent, the site automatically redirects to the agent view). To do this:

1.  Click on the 'My Agents' link in the top navigation bar
2.  Locate the agent in your list of agents, and click on the view button to the right of the agent's name

In the agent view, note the following:

*  The agent's id
*  The agent's api key (you will need to click on the show button to the right of the key to display it)

To trade in any language, create an HTTP post. The url will be `<host>/agents/trade/<agent-id>`, where `host` is the url pointing to the TDF server and `<agent-id>` is the id noted from the agent view.

The data for the post will consist of key-value pairs where each key represents a ticker symbol in the list of ticker symbols allowed by the league (currently only and all symbols in the S&P500), and the value is the number of trades of that security to sell, where negative quantities signify a sell and positive signify a buy.

Further, the data must also pass the key `apikey` with the value of the api key noted from the agent's view.

If the trade is successfull, the server will respond with a JSON object representing the agent's info and current status. Otherwise, it will return a JSON object describing the error encountered.
