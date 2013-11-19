//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Agent = mongoose.model('Agent'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    Crypto = require('crypto'),
    _ = require('underscore');

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
    Agent.find().sort('-created').populate('user', 'name username').
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
 * Looks up the price of the security represented by symbol in quotes.
 *
 * Scheme defines the price, and is one of 'bid', 'ask', and 'last'.
 *
 * If a lookup fails with the given scheme, a second lookup occures with
 * scheme of last. If that fails, an error is thrown (the symbol does not
 * exist in yahoo finance)
 */
var __get_security_value = function(quotes, symbol, scheme) {
    symbol = symbol.toUpperCase();

    if (quotes[symbol] === undefined) {
        throw {
            'msg': 'Could not look up symbol ' + symbol,
            'code': 3
        };
    }
    if (quotes[symbol][scheme] === undefined) {
        throw {
            'msg': 'Could not look up ' + scheme + ' of security ' + symbol,
            'code': 4
        };
    }

    var value = quotes[symbol][scheme];
    var error = quotes[symbol].error;
    if ((error && error !== 'false') ||
        (scheme === 'last' && (isNaN(value) || value === 0))) {
        throw {
            'msg': 'Trade on unknown security ' + symbol,
            'code': 2
        };
    }
    else if (scheme !== 'last' && isNaN(value)) {
        // In case bid/ask are not returned on this security
        return __get_security_value(quotes, symbol, 'last');
    }
    else {
        return parseFloat(value);
    }
};


/**
 * Real codes:
 *  2. Unknown symbol
 *  3. Could not look up symbol
 *  4. Could not look up scheme (bid/ask/last) of symbol (should never see)
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

        var portfolio_value = dataconn.portfolioValue(curr_composition,
                                                      quotes, false);
        var negative_value = dataconn.portfolioValue(curr_composition,
                                                     quotes, true);

        //--------------
        // Sell first...
        //--------------

        _.each(trade.sell, function(security) {
            // TODO tie bid/ask to admin
            // TODO error checking of non-existent
            var symbol = security.s.toUpperCase();
            var sell_price = __get_security_value(quotes, symbol, 'bid');
            var buy_price = __get_security_value(quotes, symbol, 'ask');
            var profit = sell_price * security.q;
            var shortSellLimit = agent.league.shortSellLimit;

            if (curr_composition[symbol] === undefined) {
                if (shortSellLimit === 0) {
                    throw {
                        'msg': 'Cannot sell a security that you do not own.',
                        'code': 1
                    };
                }
                else if (shortSellLimit*(portfolio_value + profit -
                                         buy_price * security.q) <
                         Math.abs(negative_value - buy_price * security.q)) {
                    throw {
                        'msg': 'This trade is invalid, it would cause you ' +
                               'to pass the short sell limit for this league.',
                        'code': 1
                    };
                }
            }

            curr_composition.cash00 += profit;
            curr_composition[symbol] -= security.q;

            if (curr_composition[symbol] < 0) {
                if (shortSellLimit === 0) {
                    throw {
                        'msg': 'Cannot sell a security that you do not own.',
                        'code': 1
                    };
                }
                else if (shortSellLimit*(portfolio_value + profit -
                                         buy_price * security.q) <
                         Math.abs(negative_value - buy_price * security.q)) {
                    throw {
                        'msg': 'This trade is invalid, it would cause you ' +
                               'to pass the short sell limit for this league.',
                        'code': 1
                    };
                }
            }

            if (curr_composition[symbol] === 0) {
                delete curr_composition[symbol];
            }

        });

        //---------
        // Then buy
        //---------

        _.each(trade.buy, function(security) {
            // TODO tie in admin bid/ask
            // TODO error checking
            var symbol = security.s.toUpperCase();
            var buy_price = __get_security_value(quotes, symbol, 'ask');
            var sell_price = __get_security_value(quotes, symbol, 'bid');
            var cost = buy_price * security.q;
            var curr_quantity = curr_composition[symbol] || 0;
            var leverageLimit = agent.league.leverageLimit;
            curr_composition.cash00 -= cost;
            curr_composition[symbol] = curr_quantity + security.q;

            if (curr_composition.cash00 < 0) {
                if(leverageLimit === 0) {
                    throw {
                        'msg': 'Not enough cash to purchase desired ' +
                               'securities.',
                        'code': 3
                    };
                }
                else if (leverageLimit*(portfolio_value + cost - sell_price) <
                         Math.abs(negative_value - sell_price * security.q)) {
                    throw {
                        'msg': 'This trade is invalid, it would cause you ' +
                               'to pass the leverage limit for this league.',
                        'code': 3
                    };
                }
            }
        });

        //----------------------
        // Save changes to agent
        //----------------------

        agent.portfolio.push({composition: curr_composition});
        agent.save(function () {
            agent.setStatus(false, Tick, function(agent) {
                res.jsonp(agent);
            });
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

var __setup_trade = function(agent, trade, cb) {

    var symbols = [];

    // Get symbols from current composition
    var last_portfolio = _.last(agent.portfolio);
    if (last_portfolio !== undefined) {
        var composition = last_portfolio.composition;
        symbols = _.union(symbols,
                          dataconn.compositionSymbols(composition));
    }

    // Get symbols from buy
    var buysymbols = _.map(trade.buy, function(security) {
        return security.s;
    });
    symbols = _.union(symbols, buysymbols);

    dataconn.yahooQuotes(symbols, function(err, quotes) {
        cb(quotes);
    });
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
 *  5. Attempted to trade cash
 */
exports.trade = function(req, res) {

    // 1. Determine current symbol set
    var agent = req.agent;
    var trade = req.body.trade || req.body;  // Depending on source of data

    // Filter out trades with zero quantity
    trade.buy = _.filter(trade.buy, function(security) {
        return security.q !== 0;
    });
    trade.sell = _.filter(trade.sell, function(security) {
        return security.q !== 0;
    });

    __setup_trade(agent, trade, function(quotes) {
        __execute_trade(agent, trade, quotes, res);
    });

    /*Tick.mostRecent(function(quotes) {
        __execute_trade(req, res, quotes);
    });*/
};

/**
 * Resets all trades made by the agent, returning agent.portfolio to its
 * initial state of [].
 *
 * TODO: Check if league is in competition; if so, don't allow reset.
 */
exports.reset = function(req, res) {
    var agent = req.agent;

    agent.portfolio = [];

    agent.save(function (/*err*/){
        res.jsonp(agent);
    });
};
