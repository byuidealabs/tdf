//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    dataconn = require('../controllers/dataconn'),
    _ = require('underscore');

//=============================================================================
//  Tick Schema
//=============================================================================

var TickSchema = new Schema({
    time: {type: Date, default: Date.now},
    securities: [{
        symbol: String,
        ask: Number,
        bid: Number,
        last: Number,
        error: String
    }]
});

//=============================================================================
//  Statics
//=============================================================================

/**
 * Finds the historical prices for last n timesteps
 */
TickSchema.statics.historical = function(n, cb) {
    // TODO More efficient?
    this.find({}).sort({time: -1}).limit(n).exec(function(err, docs) {
        var result = {};

        _.each(docs, function(doc) {
            var record = {};
            _.each(doc.securities, function(security) {
                record[security.symbol] = {
                    ask: security.ask,
                    bid: security.bid,
                    last: security.last,
                    error: security.error
                };
            });
            result[doc.time] = record;
        });

        cb(result);
    });
};

TickSchema.statics.mostRecent = function(cb) {
    this.historical(1, function(results) {
        cb(_.last(_.values(results)));
    });
};

TickSchema.statics.securityHistory = function(symbol, cb) {
    // TODO More efficient?
    this.find().sort({time: -1}).limit(200).exec(function(err, docs) {
        var ask = {};
        var bid = {};
        var last = {};

        _.each(docs, function(doc) {
            for(var i = 0; i < doc.securities.length; i++) {
                // for loop to exit early
                var security = doc.securities[i];
                if (security.symbol === symbol) {
                    ask[doc.time] = security.ask;
                    bid[doc.time] = security.bid;
                    last[doc.time] = security.last;
                    break;
                }
            }
        });

        dataconn.yahooQuotes([symbol], function(err, quotes) {
            var result = {
                current: {
                    ask: Number(quotes[symbol].ask),
                    bid: Number(quotes[symbol].bid),
                    last: Number(quotes[symbol].last)
                },
                ask: ask,
                bid: bid,
                last: last
            };
            cb(result);
        });

    });
};

TickSchema.statics.currentStatus = function(symbols, select, cb) {
    dataconn.yahooQuotes(symbols, function(err, quotes) {
        var stats = {};
        _.each(quotes, function(quote, symbol) {
            if (select === 'all') {
                stats[symbol] = {
                    ask: quote.ask,
                    bid: quote.bid,
                    last: quote.last
                };
            }
            else if (select === 'ask') {
                stats[symbol] = quote.ask;
            }
            else {
                stats[symbol] = quote.bid;
            }
        });
        cb(stats);
    });
};

//=============================================================================
//  Finalize
//=============================================================================

mongoose.model('Tick', TickSchema);
