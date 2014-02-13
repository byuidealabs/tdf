/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    dataconn = require('../controllers/dataconn.js'),
    _ = require('underscore');

var MAX_SIZE = 300;

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
    }],
    portfoliovalue: [{
        timestamp: {type: Date, default: Date.now},
        composition: {},
        totalvalue: Number
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
AgentSchema.methods.setStatus = function(isPrivate, Tick, cb) {
    var agent = this.toJSON();
    var curr_portfolio = _.last(agent.portfolio);
    agent.portfolio = _.last(agent.portfolio, MAX_SIZE);
    agent.portfoliovalue = _.last(agent.portfoliovalue, MAX_SIZE);

    var finalize_status = function(curr_composition, securities_value, cash,
                                   cb) {
        if (isPrivate) {
            agent.status = {
                'total_value': (cash + securities_value)
            };
        }
        else {
            agent.status = {
                'current_composition': curr_composition,
                'securities_value': securities_value,
                'cash': cash,
                'total_value': (cash + securities_value)
            };
        }

        cb(agent);
    };

    Tick.mostRecent(function(quotes) {
        if (curr_portfolio === undefined) {
            finalize_status(null, 0, agent.league.startCash, function(agent) {
                cb(agent);
            });
        }
        else {
            var composition = curr_portfolio.composition;
            var cash = composition.cash00;
            var total_value = dataconn.portfolioValue(composition,
                                                        quotes,
                                                        false);
            var value = total_value - cash;
            finalize_status(composition, value, cash, function(agent) {
                cb(agent);
            });
        }
    });
};

AgentSchema.methods.setStatusWithQuotes = function(isPrivate, quotes, cb) {
    // Use when querying all agents.
    var agent = this.toJSON();
    var curr_portfolio = _.last(agent.portfolio);
    var cash;
    var composition;
    var total_value;
    var securities_value;

    // Set Status
    if (curr_portfolio === undefined) {
        cash = agent.league.startCash;
        if (isPrivate) {
            agent.status = {
                'total_value': cash
            };
        }
        else {
            agent.status = {
                'current_composition': {},
                'cash': cash,
                'securities_value': 0,
                'total_value': cash,
            };
        }
    }
    else {
        composition = curr_portfolio.composition;
        cash = composition.cash00;
        total_value = dataconn.portfolioValue(composition, quotes, false);
        securities_value = total_value - cash;

        if (isPrivate) {
            agent.status = {
                'total_value': total_value
            };
        }
        else {
            agent.status = {
                'current_composition': composition,
                'securities_value': securities_value,
                'cash': cash,
                'total_value': total_value
            };
        }
    }

    // Strip, simplify, and privitize portfolio and portfolio value
    delete agent.portfolio;
    delete agent.apikey;
    delete agent.league;
    agent.portfoliovalue = _.last(agent.portfoliovalue, MAX_SIZE);

    var new_portfoliovalue = [];
    _.each(agent.portfoliovalue, function(portfoliovalue) {
        new_portfoliovalue.push({
            'timestamp': portfoliovalue.timestamp,
            'totalvalue': portfoliovalue.totalvalue
        });
    });
    agent.portfoliovalue = new_portfoliovalue;

    // Put current status onto list of portfolio values to graph the
    // current point as well
    agent.portfoliovalue.push({
        'timestamp': new Date(),
        'totalvalue': agent.status.total_value
    });

    cb(agent);
};

AgentSchema.methods.ownedBy = function(user) {
    return user !== undefined && user._id.equals(this.user._id);
};

/**
 * Resets the agent's portfolio by adding a new composition with the league's
 * default cash and no securities.
 *
 * pre: agent object must have league.startCash populated.
 * post: agent's default portfolio composition added to portfolio list,
 *      agent is saved, and the callback cb is called with the new agent
 *      object.
 */
AgentSchema.methods.resetPortfolio = function(cb) {
    var agent = this;
    agent.portfolio.push({composition: {cash00: agent.league.startCash}});

    agent.save(function() {
        cb(agent);
    });
};

/**
 * Virtuals
 */
AgentSchema.set('toJSON', {
    virtuals: true
});

mongoose.model('Agent', AgentSchema);
