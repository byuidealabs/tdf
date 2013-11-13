//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
TickSchema.statics.historical = function(symbol, cb) {
    var historical = this.find();
    cb(historical);
};

//=============================================================================
//  Finalize
//=============================================================================

mongoose.model('Tick', TickSchema);
