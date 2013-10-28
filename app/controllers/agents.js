/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Agent = mongoose.model('Agent'),
    League = mongoose.model('League'),
    _ = require('underscore');

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
    agent.user = req.user;

    /*League.load(req.body.leagueid, function(err, league) {
        if (err) return next(err);
        if (!agent) return next(new Agent('Failed to load league ' +
                                            req.body.leagueid +
                                            ' for new agent.'));
        agent.league = league;
    });*/

    agent.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                agent: agent
            });
        }
        console.log('\n\n' + JSON.stringify(agent) + '\n\n');
        res.jsonp(agent);
    });
};

/**
 * Update an agent
 */
exports.update = function(req, res) {
    var agent = req.agent;

    agent = _.extend(agent, req.body);

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
        throw 'Unknown security: ' + symbol + '.';
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
 * Otherwise, responds with {error: <message>}
 */
exports.trade = function(req, res) {
    var agent = req.agent;
    var trade = req.body.trade;
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
                throw 'Cannot sell a security that you do not own.';
            }

            agent.cash += profit;
            curr_composition[security.s] -= security.q;

            if (curr_composition[security.s] < 0) {
                // TODO modify to own negative quantities of security if
                // short-selling is allowed
                throw 'Cannot sell more of a security than you currently own.';
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
                throw 'Not enough cash to purchase desired securities.';
            }
        });

        //----------------------
        // Save changes to agent
        //----------------------

        agent.portfolio.push({composition: curr_composition});

        // Uncomment to reset
        //agent.cash = 100000;
        //agent.portfolio = [];

        console.log(agent.cash);
        console.log(agent.portfolio);

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
