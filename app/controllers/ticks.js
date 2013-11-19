//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    Agent = mongoose.model('Agent'),
    _ = require('underscore');

//=============================================================================
//  Helper functions
//=============================================================================

var update_portfolio_values = function(agents, quotes, cb) {
    var agent = _.first(agents);
    var restagents = _.rest(agents);

    var curr_portfolio = _.last(agent.portfolio) ||
        {composition: {cash00: agent.league.startCash}};
    var composition = {};
    var totalvalue = 0;

    _.each(curr_portfolio.composition, function(quantity, symbol) {
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
        if (!restagents.length) {
            cb();
        }
        else {
            update_portfolio_values(restagents, quotes, cb);
        }
    });
};

//=============================================================================
//  Exports
//=============================================================================

// TODO grab from leagues
var SYMBOLS = ['GOOG', 'AAPL', 'NFLX', 'MSFT'];

/**
 * Execute a tick
 */
exports.tick = function(req, res) {

    // 1. Get symbols (union of allowed symbols in all leagues)
    var allsymbols = SYMBOLS; // TODO

    // 2. Fetch and store yahoo data
    dataconn.yahooQuotes(allsymbols, function(err, quotes) {
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

        var tick = new Tick({securities: securities});
        tick.save(function() {
            // 3. Update portfolio values
            Agent.find()
                .populate('league', 'startCash')
                .exec(function(err, agents) {
                    update_portfolio_values(agents, quotes, function() {
                        res.jsonp(tick);
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
