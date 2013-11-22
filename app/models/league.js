//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore'),
    Agent = mongoose.model('Agent');

var winnerMetricsEnum = ['Greatest Value',
                         'Sharpe Ratio'];

var reallocationRulesEnum = ['No Reallocation',
                             'Redistribution'];

//=============================================================================
//  League Schema
//=============================================================================

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
    competitionStart: {
        type: Date
    },
    competitionEnd: {
        type: Date
    },
    leaguePhase: {
        type: Number,
        default: 0
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
    },

    // Default Starting Cash for League

    startCash: {
        type: Number,
        default: 100000
    },

    shortSellLimit: {
        type: Number,
        default: 0
    },

    leverageLimit: {
        type: Number,
        default: 0
    },

    redistribute: {
        on: {
            type: Boolean,
            default: false
        },
        first: Date,
        next: Date,
        period: {
            type: Number,
            default: 0
        }
    }
});

//=============================================================================
//  Validations
//=============================================================================

LeagueSchema.path('name').validate(function(name) {
    return name.length;
}, 'Name cannot be blank');

// TODO Add more validations on all fields

//=============================================================================
//  Statics
//=============================================================================

LeagueSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).exec(cb);
    }
};

//=============================================================================
//  Methods
//=============================================================================

var reset_agents = function(agents, cb) {
    if (!agents.length) {
        cb();
    }
    else {
        var agent = _.first(agents);
        var restagents = _.rest(agents);

        agent.resetPortfolio(function() {
            reset_agents(restagents, cb);
        });
    }
};

var promoteToPostCompetition = function(league, cb) {
    var competitionEndTime = new Date(league.competitionEnd).getTime();
    if (league.leaguePhase === 2 && Date.now() > competitionEndTime) {

        console.log('Promoting league ' + league.name +
                    ' to post-competition phase');

        league.leaguePhase = 3;
        league.save(function() {
            cb();
        });
    }
    else {
        cb();
    }
};

var promoteToCompetition = function(league, cb) {
    var competitionStartTime = new Date(league.competitionStart).getTime();
    if (league.leaguePhase === 1 && Date.now() > competitionStartTime) {

        console.log('Promoting league ' + league.name +
                    ' to competition phase');

        league.leaguePhase = 2;
        league.save(function() {
            Agent.find({league: league})
                .populate('league', 'startCash')
                .exec(function(err, agents) {
                    reset_agents(agents, function() {
                        promoteToPostCompetition(league, cb);
                    });
                });
        });
    }
    else {
        promoteToPostCompetition(league, cb);
    }
};

var promoteToTrial = function(league, cb) {
    var trialStartTime = new Date(league.trialStart).getTime();
    if (league.leaguePhase === 0 && Date.now() > trialStartTime) {

        console.log('Promoting league ' + league.name + ' to trial phase');

        league.leaguePhase = 1;
        league.save(function() {
            promoteToCompetition(league, cb);
        });
    }
    else {
        promoteToCompetition(league, cb);
    }
};

var executeRedistribution = function(agents, cb) {
    if (!agents.length) {
        cb();
    }
    else {
        var agent = _.first(agents);
        var restagents = _.rest(agents);

        var last_portfolio = _.last(agent.portfolio);
        if (last_portfolio === undefined) {
            last_portfolio = {composition: {cash00: agent.league.startCash}};
        }
        var next_composition = _.clone(last_portfolio.composition);
        next_composition.cash00 -= 100;
        agent.portfolio.push({composition: next_composition});
        agent.save(function() {
            executeRedistribution(restagents, cb);
        });
    }
};

var redistributePortfolios = function(league, cb) {
    var next_dist = league.redistribute.next;
    if (next_dist === undefined) {
        next_dist = league.redistribute.first;
    }
    next_dist = next_dist.getTime();

    if (Date.now() >= next_dist) {
        console.log('Redistributing agents in league');
        var new_next_dist = next_dist;
        while (league.redistribute.period > 0 &&
               new_next_dist <= Date.now()) {
            // Redistributes on every tick if redistribution period = 0
            new_next_dist += league.redistribute.period * 1000;
            // TODO change seconds to hours
        }
        league.redistribute.next = new Date(new_next_dist);
        league.save(function() {
            Agent.find({league: league})
            .populate('league', 'startCash')
            .exec(function(err, agents) {
                executeRedistribution(agents, cb);
            });
        });
    }
    else {
        cb();
    }
};

LeagueSchema.methods.promote = function(cb) {
    var league = this;
    promoteToTrial(league, function() {
        if (league.redistribute.on) {
            redistributePortfolios(league, cb);
        }
        else {
            cb();
        }
    });
};

//=============================================================================
//  Module Registration
//=============================================================================

mongoose.model('League', LeagueSchema);
