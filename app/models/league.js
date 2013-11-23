//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore'),
    //sylvester = require('sylvester'),
    //Matrix = sylvester.Matrix,
    //Vector = sylvester.Vector,
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
//  Methods Helpers
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

var promote_to_postcompetition = function(league, cb) {
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

var promote_to_competition = function(league, cb) {
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
                        promote_to_postcompetition(league, cb);
                    });
                });
        });
    }
    else {
        promote_to_postcompetition(league, cb);
    }
};

var promote_to_trial = function(league, cb) {
    var trialStartTime = new Date(league.trialStart).getTime();
    if (league.leaguePhase === 0 && Date.now() > trialStartTime) {

        console.log('Promoting league ' + league.name + ' to trial phase');

        league.leaguePhase = 1;
        league.save(function() {
            promote_to_competition(league, cb);
        });
    }
    else {
        promote_to_competition(league, cb);
    }
};

var compute_redistribution = function(agents, cb) {
    // TODO: Build an numpy-like library
    var k = 10; // TODO
    var n = 5;  // TODO
    var delta = {};
    var deltabar = {};
    var x = {};

    // Compute x, delta, deltabar
    _.each(agents, function(agent) {
        // Gather last k + 1 values
        var values = _.last(agent.portfoliovalue, k + 1);
        values = _.map(values, function(value) {
            return value.totalvalue;
        });
        x[agent._id] = _.last(values, k);

        // Compute delta (return) for last k times
        delta[agent._id] = [];
        for (var i = 1; i < values.length; i++) {
            // TODO make efficient
            var r = values[i] / values[i - 1];
            delta[agent._id].push(r);
        }

        // Compute deltabar (average return over last k times)
        // Assumes arithmetic mean (TODO possibly allow geometric)
        var deltabar_agent = 0;
        _.each(delta[agent._id], function(d) {
            deltabar_agent += d;
        });
        deltabar[agent._id] = deltabar_agent / k;
    });

    console.log(JSON.stringify(delta));
    console.log(JSON.stringify(deltabar));
    console.log(JSON.stringify(x));

    // Compute competitionvalues
    var competitionvalues = Array.apply(null, new Array(k)).map(
        Number.prototype.valueOf, 0);
    _.each(x, function(agent_x) {
        for (var i = 0; i < k; i++) {
            competitionvalues[i] += agent_x[i];
        }
    });
    console.log(JSON.stringify(competitionvalues));

    // Compute z
    var z = {};
    _.each(x, function(agent_x, agent_id) {
        z[agent_id] = [];
        for (var i = 0; i < k; i++) {
            z[agent_id].push(agent_x[i] / competitionvalues[i]);
        }
    });
    console.log(JSON.stringify(z));

    // Compute uk
    var uk = {};
    var den = 0;
    _.each(agents, function(agent) {
        den += _.last(z[agent._id]) * _.last(delta[agent._id]);
    });
    _.each(agents, function(agent) {
        uk[agent._id] = _.last(z[agent._id]) * _.last(delta[agent._id]) / den;
    });
    console.log(JSON.stringify(uk));

    cb();
};

var execute_redistribution = function(agents, cb) {
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
        //next_composition.cash00 -= 100;
        agent.portfolio.push({composition: next_composition});
        agent.save(function() {
            execute_redistribution(restagents, cb);
        });
    }
};

var redistribute_portfolios = function(league, cb) {
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
                compute_redistribution(agents, function() {
                    execute_redistribution(agents, cb);
                });
            });
        });
    }
    else {
        cb();
    }
};

//=============================================================================
//  Methods
//=============================================================================

/**
 * On every 'tick' made by the grunt task manager, this is called to do two
 * things:
 *
 * (1) Check the League's phase. If the phase needs to change, promote the
 *     league to the next phase(s).
 *     * If promoting to the competition period, resets the portfolio of every
 *       agent in the league.
 * (2) If the redistribution rule is turned on in the league, automatically
 *     redistributes the values of the portfolio according to the
 *     redistribution rules.
 *
 */
LeagueSchema.methods.promote = function(cb) {
    var league = this;
    promote_to_trial(league, function() {
        if (league.redistribute.on) {
            redistribute_portfolios(league, cb);
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
