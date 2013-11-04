/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Agent = mongoose.model('Agent'),
    Crypto = require('crypto'),
    _ = require('underscore');

/**
 * Creates a random ascii key of the specified length
 */
var randomAscii = function(len){
    // Derived from
    // http://kun.io/blog/42051818404/Node.js:-Creating-a-Random-String
    var bytes = Crypto.randomBytes(len);
    var i;
    var verificationCode = '';

    // loop through each byte
    for (i=0; i < bytes.length; i++) {
        var c = bytes[i]; // the character in range 0 to 255
        var c2 = Math.floor(c / 10.24); // transform to range 0-25 and round down
        var c3 = c2 + 97; // ASCII a to z is 97 to 122
        // now convert the transformed character code to its string
        // value and append to the verification code
        verificationCode += String.fromCharCode(c3);
    }
    return verificationCode;
};

/**
 * Find agent by id
 */
exports.agent = function(req, res, next, id) {
    Agent.load(id, function(err, agent) {
        if (err) {
            return next(err);
        }
        if (!agent) {
            return next(new Agent('Failed to load agent ' + id));
        }
        req.agent = agent;
        next();
    });
};

/**
 * Create an agent
 */
exports.create = function(req, res) {
    var agent = new Agent(req.body);
    agent.apikey = randomAscii(32);
    agent.user = req.user;

    agent.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                agent: agent
            });
        }
        res.jsonp(agent);
    });
};

/**
 * Update an agent
 */
exports.update = function(req, res) {
    var agent = req.agent;
    agent = _.extend(agent, _.omit(req.body, 'apikey'));

    agent.save(function(/*err*/) {
        res.jsonp(agent);
    });
};

/**
 * Delete an agent
 */
exports.destroy = function(req, res) {
    var agent = req.agent;

    agent.remove(function(err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(agent);
        }
    });
};

/**
 * Show an agent
 */
exports.show = function(req, res) {
    //TODO add current value and historical values

    if (req.user === undefined || !req.user._id.equals(req.agent.user._id)) {
        req.agent = _.omit(req.agent.toJSON(), 'portfolio', 'apikey');
    }
    res.jsonp(req.agent);
};

/**
 * List of agents
 */
exports.all = function(req, res) {
    Agent.find().sort('-created').populate('user', 'name username').
        populate('league', 'name').exec(function (err, agents) {

        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(agents);
        }
    });
};

//=============================================================================
//  Trading System
//=============================================================================

// TODO: tie into Yahoo finance and move out of controller
var get_security_price = function(symbol, method) {
    if (symbol === 'notasymbol') {
        throw {
            'msg': 'Unknown security: ' + symbol + '.',
            'code': 4
        };
    }
    if (method === 'sell') {
        return 110;
    }
    if (method === 'buy') {
        return 100;
    }
};

/**
 * Allow a trade to be made
 *
 * If trade is successful, responds with the new agent
 * Otherwise, responds with {error: {'msg': <message>, 'code': <code>}}
 *
 * Error codes are as follows:
 *  1. Attempted to sell a security that does not own
 *  2. Attempted to sell more of a security than already owns
 *  3. Attempted to buy more than has cash to purchase
 *  4. Attempted to buy or sell on a nonexistant security (symbol doesn't
 *     match any known security)
 */
exports.trade = function(req, res) {

    var agent = req.agent;
    var trade = req.body.trade || req.body;  // Depending on source of data
    var last_portfolio = _.last(req.agent.portfolio);
    var curr_composition;

    if (last_portfolio === undefined) {
        curr_composition = {};
    }
    else {
        curr_composition = _.clone(last_portfolio.composition);
    }

    //console.log('Trade = ' + JSON.stringify(trade));

    try {
        //--------------
        // Sell first...
        //--------------

        _.each(trade.sell, function(security) {
            var price = get_security_price(security.s, 'sell');
            var profit = price * security.q;

            //agent.cash += profit;

            if (curr_composition[security.s] === undefined) {
                // TODO remove when short-selling is allowed
                throw {
                    'msg': 'Cannot sell a security that you do not own.',
                    'code': 1
                };
            }

            agent.cash += profit;
            curr_composition[security.s] -= security.q;

            if (curr_composition[security.s] < 0) {
                // TODO modify to own negative quantities of security if
                // short-selling is allowed
                throw {
                    'msg': 'Cannot sell more of a security than you ' +
                           'currently own.',
                    'code': 2
                };
            }

            if (curr_composition[security.s] === 0) {
                delete curr_composition[security.s];
            }

        });

        //---------
        // Then buy
        //---------

        _.each(trade.buy, function(security) {
            var price = get_security_price(security.s, 'buy');
            var cost = price * security.q;
            var curr_quantity = curr_composition[security.s] || 0;

            agent.cash -= cost;
            curr_composition[security.s] = curr_quantity + security.q;

            if (agent.cash < 0) {
                // TODO tie into league to allow potential leverage
                throw {
                    'msg': 'Not enough cash to purchase desired securities.',
                    'code': 3
                };
            }
        });

        //----------------------
        // Save changes to agent
        //----------------------

        agent.portfolio.push({composition: curr_composition});

        // Uncomment to reset
        //agent.cash = 100000;
        //agent.portfolio = [];

        agent.save(function (/*err*/) {
            res.jsonp(agent);
        });
    }
    catch (err) {

        //-------------------------
        // An error was encountered
        //-------------------------

        res.jsonp({
            error: err
        });
    }
};

exports.reset = function(req, res) {
    var agent = req.agent;

    agent.cash = 100000; // TODO grab from league for default starting cash
    agent.portfolio = [];

    agent.save(function (/*err*/){
        res.jsonp(agent);
    });
};

exports.resetapikey = function(req, res) {
    var agent = req.agent;
    agent.apikey = randomAscii(32);
    agent.save(function (/*err*/) {
        res.jsonp(agent);
    });
};
