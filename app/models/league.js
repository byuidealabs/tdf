/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;

var winnerMetricsEnum = ['Greatest Value',
                         'Sharpe Ratio'];

var reallocationRulesEnum = ['No Reallocation',
                             'Redistribution'];

/**
 * League Schema
 */
var LeagueSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        default: '',
        trim: true
    },

    // User Settings
    
    isOpenLeague: {
        // If league is open, anybody with access to server can join league
        type: Boolean,
        default: true
    },
    maxAgents: {
        // Maximum number of agents allowed in league
        type: Number,
        default: 100
    },
    maxrUserAgents: {
        // Maximum number of agents allowed per user in league
        type: Number,
        default: 100
    },
    principalAgentRequired: {
        // Whether a user is requred to set an agent as a principle agent
        // to participate in the league (only a principle agent can win).
        type: Boolean,
        default: false
    },

    // Simulation Settings
    
    trialStart: {
        // Start of trial period
        type: Date
    },
    trialEnd: {
        type: Date
    },
    competitionStart: {
        type: Date
    },
    competitionEnd: {
        type: Date
    },

    // Metrics Settings

    winnerMetric: {
        type: String,
        enum: winnerMetricsEnum
    },

    // Reallocation Settings

    reallocationRule: {
        type: String,
        enum: reallocationRulesEnum
    }
});    

/**
 * Validations
 */
LeagueSchema.path('name').validate(function(name) {
    return name.length;
}, 'Name cannot be blank');

// TODO Add more validations on all fields

/**
 * Statics
 */
LeagueSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).exec(cb);
    }
};

mongoose.model('League', LeagueSchema);
