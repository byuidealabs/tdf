/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore');

/**
 * Agent Schema
 */
var AgentSchema = new Schema({
    created: {type: Date, default: Date.now
    },
    name: {type: String, default: '', trim: true},
    description: {type: String, default: '', trim: true},
    apikey: {type: String, default: ''},
    // Historical portfolio values
    user: {type: Schema.ObjectId, ref: 'User'},
    league: {type: Schema.ObjectId, ref: 'League'},
    portfolio: [{
        timestamp: {type: Date, default: Date.now},
        composition: {}
    }]
});

/**
 * Validations
 */
AgentSchema.path('name').validate(function(name) {
    return name.length;
}, 'Name cannot be blank');

/**
 * Statics
 */
AgentSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).populate('user', 'username').populate('league', 'name startCash shortSellLimit leverageLimit').exec(cb);
    }
};

/**
 * Virtuals
 */
AgentSchema.set('toJSON', {
    virtuals: true
});

AgentSchema.virtual('status').get(function() {
    var curr_portfolio = _.last(this.portfolio);

    var cash = this.league.startCash;
    if (curr_portfolio !== undefined) {
        cash = curr_portfolio.composition.cash;
    }

    var securities_value = 0; //TODO
    return {
        'current_composition': curr_portfolio,
        'securities_value': securities_value,
        'cash': cash,
        'total_value': (cash + securities_value)
    };
});

mongoose.model('Agent', AgentSchema);
