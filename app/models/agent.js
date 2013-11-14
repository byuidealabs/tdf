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
AgentSchema.methods.setStatus = function(isPrivate, Tick, cb) {
    var agent = this.toJSON();
    var curr_portfolio = _.last(agent.portfolio);


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

    var load_history = function(agent, quotes, cb) {

        // TODO determine length to load
        Tick.historical(50, function(histories) {
            agent.history = {};

            _.each(histories, function(history, time) {
                var ticktime = new Date(time);
                var most_recent_comp = null;
                var most_recent_date = null;
                _.each(agent.portfolio, function(port) {
                    console.log('');
                    console.log(port.timestamp);
                    console.log(ticktime);
                    console.log(port.timestamp.getTime() < ticktime.getTime());
                    if (port.timestamp.getTime() < ticktime.getTime() &&
                        (most_recent_date === null ||
                         port.timestamp.getTime() >
                          most_recent_date.getTime())) {
                        most_recent_date = port.timestamp;
                        most_recent_comp = port.composition;
                    }
                });
                if (most_recent_comp !== null) {
                    agent.history[ticktime] = dataconn.portfolioValue(
                        most_recent_comp, quotes, false);
                }
                else {
                    agent.history[ticktime] = agent.league.startCash;
                }
            });

            cb(agent);
        });
    };

    if (curr_portfolio === undefined) {
        finalize_status(null, 0, agent.league.startCash, cb);
    }
    else {
        Tick.mostRecent(function(quotes) {
            var composition = curr_portfolio.composition;
            var cash = composition.cash00;
            var total_value = dataconn.portfolioValue(composition,
                                                        quotes,
                                                        false);
            var value = total_value - cash;
            finalize_status(composition, value, cash, function(agent) {
                load_history(agent, quotes, cb);
            });
        });
    }
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

mongoose.model('Agent', AgentSchema);
