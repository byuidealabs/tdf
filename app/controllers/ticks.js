//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    _ = require('underscore');

//=============================================================================
//  Exports
//=============================================================================

// TODO grab from leagues
var SYMBOLS = ['GOOG', 'AAPL', 'NFLX', 'MSFT'];

/**
 * Execute a tick
 */
exports.tick = function(req, res) {
    dataconn.yahooQuotes(SYMBOLS, function(err, quotes) {
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
        tick.save(function(/*err*/) {
            res.jsonp(tick);
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
