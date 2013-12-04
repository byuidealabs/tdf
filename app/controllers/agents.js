//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Agent = mongoose.model('Agent'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    Crypto = require('crypto'),
    _ = require('underscore');

var SANDP500 = require('../data/sandp500.js').sandp500_list;

//=============================================================================
//  Helper Functions
//=============================================================================

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
        var c2 = Math.floor(c / 10.24); // transform to range 0-25 and round
                                        // down
        var c3 = c2 + 97; // ASCII a to z is 97 to 122
        // now convert the transformed character code to its string
        // value and append to the verification code
        verificationCode += String.fromCharCode(c3);
    }
    return verificationCode;
};

//=============================================================================
//  Exports: CRUD
//=============================================================================

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
    var agent = req.agent;
    var user = req.user;
    var isPrivate = !agent.ownedBy(user);

    agent.setStatus(isPrivate, Tick, function(agent) {
        if (isPrivate) {
            agent = _.omit(agent, 'portfolio', 'apikey');
            agent.status = _.omit(agent.status, 'current_portfolio');
        }
        res.jsonp(agent);
    });
};

/**
 * List of agents
 */
exports.all = function(req, res) {

    var user = req.user;
    Agent.find(req.query).sort('-created').populate('user', 'name username').
        populate('league', 'name startCash').exec(function (err, agents) {

        var setStatusOnAgent = function(i, cb) {
            if (i < agents.length) {
                agents[i].setStatus(!agents[i].ownedBy(user), Tick,
                                    function(agent) {
                    agents[i] = agent;
                    cb(i+1, cb);
                });
            }
            else {
                res.jsonp(agents);
            }
        };

        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            //res.jsonp(agents);
            setStatusOnAgent(0, setStatusOnAgent);
        }
    });
};

/**
 * Regenerates a new random api key for the user.
 */
exports.resetapikey = function(req, res) {
    var agent = req.agent;
    agent.apikey = randomAscii(32);
    agent.save(function (/*err*/) {
        res.jsonp(agent);
    });
};

//=============================================================================
//  Exports: Trading System
//=============================================================================


/**
 * Real codes:
 *  1. Empty trade
 *  2. Unknown symbol
 *  3. Could not look up symbol, not allowed by league
 *  4. Could not look up scheme (bid/ask/last) of symbol (should never see)
 *  5. Leverage limit exceeded
 *  6. Empty trade
 *  7. Tried to trade with a non-integer quantity.
 */
var __execute_trade = function(agent, trade, quotes, res) {

    try {
        var last_portfolio = _.last(agent.portfolio);
        var curr_composition;

        if (last_portfolio === undefined) {
            curr_composition = {
                'cash00': agent.league.startCash
            };
        }
        else {
            curr_composition = _.clone(last_portfolio.composition);
        }

        var pre_composition = _.clone(curr_composition);

        // Change portfolio composition based on trade
        _.each(trade, function(quantity, symbol) {
            symbol = symbol.toUpperCase();
            var curr_quantity = curr_composition[symbol] || 0;
            agent.league.tradeMethods = {
                // TODO move to league persistancy and let admin modify
                buy: 'ask',
                sell: 'bid'
            };
            var tradeMethod;
            if (quantity < 0) {
                tradeMethod = agent.league.tradeMethods.buy;
            }
            else if (quantity > 0) {
                tradeMethod = agent.league.tradeMethods.sell;
            }
            else {
                // Don't trade if q is zero
                return;
            }
            var price = dataconn.get_security_value(quotes, symbol,
                                                    tradeMethod);
            var trade_rate = price * quantity;

            curr_composition.cash00 -= trade_rate;
            curr_composition[symbol] = curr_quantity + quantity;

            if (curr_composition[symbol] === 0) {
                // Filter out all symbols with zero quantity
                delete curr_composition[symbol];
            }
        });

        // Check if any leverage limits are reached
        console.log(JSON.stringify(curr_composition));
        var value = dataconn.portfolioValue(curr_composition, quotes, false);
        var neg_value = -1 * dataconn.portfolioValue(curr_composition, quotes,
                                                        true);
        var max_neg_value = agent.league.leverageLimit * value;

        if (neg_value > max_neg_value) {
            var curr_neg_value = -1 * dataconn.portfolioValue(pre_composition,
                                                                quotes,
                                                                true);
            throw {
                'msg': 'Leverage limit exceeded.',
                'code': 5,
                'negative_value': neg_value,
                'current_value': value,
                'current_negative_value': curr_neg_value,
                'leverage_limit': agent.league.leverageLimit,
                'max_negative_value': max_neg_value
            };
        }

        // Save changes to agent
        agent.portfolio.push({composition: curr_composition});
        agent.save(function () {
            agent.setStatus(false, Tick, function(agent) {
                res.jsonp(agent);
            });
        });
    }
    catch (err) {
        // An error was encountered
        res.jsonp({
            error: err
        });
    }

};

/**
 * Throws an error if any symbol in symbols is not in the list of allowed
 * symbols in the agent's league.
 */
var __check_all_symbols_allowed = function(league, symbols) {
    var league_symbols = SANDP500;
    for (var i = 0; i < symbols.length; i++) {
        // not using underscore to loop in order to break early for efficiency
        var symbol = symbols[i];

        if (!_.contains(league_symbols, symbol)) {
            throw {
                'msg': 'Symbol ' + symbol + ' not allowed by league.',
                'code': 3
            };
        }
    }
};

var __setup_trade = function(agent, trade, cb) {

    var symbols = [];

    // Get symbols from current composition
    var last_portfolio = _.last(agent.portfolio);
    if (last_portfolio !== undefined) {
        var composition = last_portfolio.composition;
        symbols = _.union(symbols,
                        dataconn.compositionSymbols(composition));
    }

    // Get symbols from trade
    symbols = _.union(symbols, _.keys(trade));
    symbols = _.map(symbols, function(symbol) {
        return symbol.toUpperCase();
    });

    __check_all_symbols_allowed(agent.league, symbols);
    dataconn.yahooQuotes(symbols, function(err, quotes) {
        cb(quotes);
    });
};

/**
 * Allow a trade to be made
 *
 * If trade is successful, responds with the new agent
 * Otherwise, responds with {error: {'msg': <message>, 'code': <code>}}
 */
exports.trade = function(req, res) {

    // 1. Determine current symbol set
    var agent = req.agent;
    var trade = req.body.trade || req.body;  // Depending on source of data

    console.log('Trading');
    console.log(trade);
    console.log(JSON.stringify(trade));

    // TODO: error check to see if trade is {string->number, ...}

    try {
        // Remove API key
        trade = _.omit(trade, 'apikey');

        // Convert quantities to numbers if strings
        _.each(trade, function(q, s) {
            if (isNaN(q)) {
                throw {
                    'msg': 'Trade quantity must be an integer.',
                    'code': 7
                };
            }
            trade[s] = Number(q);
        });

        if (_.size(trade) === 0) {
            throw {
                'msg': 'Empty Trade',
                'code': 6
            };
        }
        else {
            __setup_trade(agent, trade, function(quotes) {
                __execute_trade(agent, trade, quotes, res);
            });
        }
    }
    catch (err) {
        // An error was encountered
        res.jsonp({
            error: err
        });
    }
};

/**
 * Resets all trades made by the agent, returning agent.portfolio to its
 * initial state of [].
 *
 * TODO: Check if league is in competition; if so, don't allow reset.
 */
exports.reset = function(req, res) {
    req.agent.resetPortfolio(function(agent) {
        res.jsonp(agent);
    });
};
