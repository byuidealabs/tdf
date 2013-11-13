//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
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
 * Finds the historical prices for the stock of the given symbol.
 */
TickSchema.statics.historical = function(n, cb) {
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

//=============================================================================
//  Finalize
//=============================================================================

mongoose.model('Tick', TickSchema);
