/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    dataconn = require('../controllers/dataconn.js'),
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
        }).populate('user', 'username')
          .populate('league', 'name startCash shortSellLimit leverageLimit')
          .exec(cb);
    }
};

/**
 * Methods
 */
AgentSchema.methods.setStatus = function(isPrivate, cb) {
    var agent = this.toJSON();
    var that = this;
    var curr_portfolio = _.last(agent.portfolio);

    console.log(JSON.stringify(curr_portfolio));

    var finalize_status = function(curr_composition, securities_value, cash,
                                   cb) {
        agent.status = {
            'current_composition': curr_composition,
            'securities_value': securities_value,
            'cash': cash,
            'total_value': (cash + securities_value)
        };

        if (isPrivate) {
            agent.status = _.pick(that.agent.status, 'total_value');
        }

        that.setHistory(isPrivate, function(agent) {
            cb(agent);
        });
    };

    if (curr_portfolio === undefined) {
        finalize_status(null, 0, agent.league.startCash, cb);
    }
    else {
        var symbols = dataconn.compositionSymbols(curr_portfolio.composition);
        dataconn.yahooQuotes(null, null, symbols, cb,
            function(req, res, err, quotes, cb) {
                var composition = curr_portfolio.composition;
                var cash = composition.cash00;
                var total_value = dataconn.yahooPortfolioValue(composition,
                                                               quotes,
                                                               false);
                var value = total_value - cash;
                finalize_status(composition, value, cash, cb);
            });
    }
};
AgentSchema.methods.setHistory = function(isPrivate, cb) {
    var agent = this.toJSON();
    var that = this;
    var portfolio = that.portfolio;

    // TODO tie into an admin perhaps (or let user choose?)
    var totalTicks = 10;
    var tickSpacing = 600; // 10 minutes

    var symbols = dataconn.agentSymbols(portfolio);
    console.log(symbols);
    cb(that);
};

AgentSchema.methods.ownedBy = function(user) {
    return user !== undefined && user._id.equals(this.user._id);
};

/**
 * Virtuals
 */
AgentSchema.set('toJSON', {
    virtuals: true
});

/**AgentSchema.virtual('status').get(function() {
    var curr_portfolio = _.last(this.portfolio);

    var cash = this.league.startCash;
    if (curr_portfolio !== undefined) {
        cash = curr_portfolio.composition.cash00;
    }

    var securities_value = dataconn.; //TODO
    return {
        'current_composition': curr_portfolio,
        'securities_value': securities_value,
        'cash': cash,
        'total_value': (cash + securities_value)
    };
});**/

mongoose.model('Agent', AgentSchema);
