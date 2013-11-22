//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    Agent = mongoose.model('Agent'),
    League = mongoose.model('League'),
    _ = require('underscore');

//=============================================================================
//  Helper functions
//=============================================================================

var sandp500 = require('../data/sandp500.js');
var SYMBOLS = sandp500.sandp500_list;

var promote_leagues = function(leagues, symbols, cb) {

    if (!leagues.length) {
        cb(symbols);
    }
    else {
        var league = _.first(leagues);
        var restleagues = _.rest(leagues);

        symbols = _.union(symbols, SYMBOLS); //TODO

        league.promote(function() {
            promote_leagues(restleagues, symbols, cb);
        });
    }
};

var tick_leagues = function(cb) {
    League.find().exec(function(err, leagues) {
        promote_leagues(leagues, SYMBOLS, cb); // Scrapes s&p 500 by default
    });
};

var securities_list = function(quotes) {
    var securities = [];
    _.each(quotes, function(data, symbol) {
        var security = {
            symbol: symbol,
            ask: data.ask,
            bid: data.bid,
            last: data.last,
            error: data.error
        };
        securities = _.union(securities, [security]);
    });
    return securities;
};

var update_portfolio_values = function(agents, quotes, cb) {
    if (!agents.length) {
        cb();
    }
    else {
        var agent = _.first(agents);
        var restagents = _.rest(agents);

        var curr_portfolio = _.last(agent.portfolio) ||
            {composition: {cash00: agent.league.startCash}};
        var new_composition = _.clone(curr_portfolio.composition);
        var composition = {};
        var totalvalue = dataconn.portfolioValue(new_composition,
                                                 quotes, false);

        var neg_value = -1*dataconn.portfolioValue(new_composition, quotes,
                                                   true);
        var max_neg = totalvalue * agent.league.leverageLimit;
        if (totalvalue <= 0) {
            console.log('Value of agent ' + agent.name +
                        ' has reached 0. Freezing account.');
            // TODO
        }
        else if (neg_value > max_neg) {
            console.log('Leverage limit exceeded on agent ' + agent.name +
                        '. Selling off securities.');
            var sell_method = 'bid'; //TODO

            var curr_neg_value = neg_value;
            while (curr_neg_value > max_neg) {
                // Keep selling random securities until within leverage limit
                // or until there is nothing left to sell

                // Choose random security
                var symbols = dataconn.compositionSymbols(new_composition,
                                                          true);
                if (_.size(symbols) === 0) {
                    break;
                }
                console.log(symbols);
                var rdm = Math.floor(Math.random()*symbols.length);
                var symbol = symbols[rdm];

                // Sell 1 share of security, cleaning list if no more of that
                // security exists
                var price = dataconn.get_security_value(quotes, symbol,
                                                        sell_method);

                new_composition.cash00 += price;
                new_composition[symbol] -= 1;

                if (new_composition[symbol] === 0) {
                    delete new_composition[symbol];
                }

                // Recompute neg_value and max_neg
                curr_neg_value = -1 * dataconn.portfolioValue(new_composition,
                                                              quotes, true);
            }
            agent.portfolio.push({composition: new_composition});
        }

        totalvalue = 0; //reset for new computation
        _.each(new_composition, function(quantity, symbol) {
            // TODO move into dataconn
            if (symbol === 'cash00') {
                totalvalue += quantity;
            }
            else {
                var pricetype = 'bid';  //TODO get from league
                var sellprice = quotes[symbol][pricetype];
                var securityprice = sellprice * quantity;
                totalvalue += securityprice;
                composition[symbol] = securityprice;
            }
        });

        agent.portfoliovalue.push({
            composition: composition,
            totalvalue: totalvalue
        });

        agent.save(function() {
            update_portfolio_values(restagents, quotes, cb);
        });
    }
};

//=============================================================================
//  Exports
//=============================================================================

// TODO grab from leagues

/**
 * Execute a tick
 */
exports.tick = function(req, res) {

    // 1. Promote leagues and get their symbols
    tick_leagues(function(allsymbols) {

        // 2. Fetch yahoo data
        dataconn.yahooQuotes(allsymbols, function(err, quotes) {
            var securities = securities_list(quotes);
            var tick = new Tick({securities: securities});
            tick.save(function(/*err*/) {
                // 3. Update portfolio values
                Agent.find()
                    .populate('league', 'startCash leverageLimit')
                    .exec(function(err, agents) {
                        update_portfolio_values(agents, quotes, function() {
                            res.jsonp(tick);
                        });
                    });
            });
        });

    });

};

/**
 * Gets the historical prices for the last n ticks.
 */
exports.historical = function(req, res) {
    var n = req.n;

    Tick.historical(n, function(values) {
        res.jsonp(values);
    });
};
