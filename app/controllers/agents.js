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
        // To test non-existent symbols, TODO replace
        return false;
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
 */
exports.trade = function(req, res) {
    var agent = req.agent;
    var trade = req.body.trade;
    var last_portfolio = _.last(req.agent);
    var curr_composition;

    //console.log('Trade = ' + JSON.stringify(trade));

    if (last_portfolio === undefined) {
        curr_composition = {};
    }
    else {
        curr_composition = _.clone(last_portfolio.composition);
    }

    // Sell first...
    _.each(trade.sell, function(security) {
        var price = get_security_price(security.s, 'sell');
        var profit = price * security.q;
        agent.cash += profit;
    });

    // Then buy
    _.each(trade.buy, function(security) {
        var price = get_security_price(security.s, 'buy');
        var cost = price * security.q;
        var curr_quantity = curr_composition[security.s] || 0;

        agent.cash -= cost;
        curr_composition[security.s] = curr_quantity + security.q;
    });

    agent.portfolio.push({composition: curr_composition});

    console.log(agent.cash);
    console.log(agent.portfolio);

    res.jsonp(agent);
};



