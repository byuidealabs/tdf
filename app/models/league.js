//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore'),
    numjs = require('numjs'),
    narray = numjs.narray,
    nnum = numjs.nnum,
    sylvester = require('sylvester'),
    Matrix = sylvester.Matrix,
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
    var alpha = 1 / (k + 1);
    var beta = 1 / (k + 1);
    var delta = {};
    var deltabar = {};
    var x = {};

    var i;
    var j;

    // Compute x, delta, deltabar
    _.each(agents, function(agent) {
        var id = agent._id;
        // Gather last k + 1 values
        var values = _.last(agent.portfoliovalue, k + 1);
        values = _.map(values, function(value) {
            return nnum.Round(value.totalvalue, 2);
        });
        x[id] = _.last(values, k);

        // Compute delta (return) for last k times
        // TODO zero-handling in values
        delta[id] = narray.PDiv(narray.Shift(values, 1), values);
        delta[id] = _.map(delta[id], function(d) {
            return nnum.Round(d, 4);
        });

        // Compute deltabar (average return over last k times)
        // Assumes arithmetic mean (TODO possibly allow geometric)
        deltabar[id] = narray.Mean(delta[id]);
    });

    // Compute competitionvalues
    var competitionvalues = narray.Zeros(k);
    _.each(x, function(agent_x) {
        competitionvalues = narray.PAdd(competitionvalues, agent_x);
    });

    // Compute z and Z
    var z = [];
    _.each(x, function(agent_x) {
        z.push(narray.PDiv(agent_x, competitionvalues));
    });
    var Z = [];
    for (i = 0; i < k; i++) {
        for (j = 0; j < z.length; j++) {
            Z.push(nnum.Round(z[j][i], 4));
        }
    }

    // Compute uk
    var u = [];
    var den = 0;
    var index = 0;
    _.each(agents, function(agent) {
        den += _.last(z[index]) * _.last(delta[agent._id]);
        index++;
    });
    index = 0;
    _.each(agents, function(agent) {
        var curr_u = _.last(z[index]) * _.last(delta[agent._id]) / den;
        u.push(nnum.Round(curr_u, 2));
    });

    // Build A
    var numagents = _.size(agents);
    var dim = k * numagents;
    var A = new Array(dim);
    var B = new Array(dim);
    for (i = 0; i < dim; i++) {
        A[i] = narray.Zeros(dim);
        B[i] = narray.Zeros(numagents);
        for (j = 0; j < dim; j++) {
            if (i < dim - numagents) {
                if (j === i + numagents) {
                    A[i][j] = 1;
                }
            }
            else {
                if (j % numagents === i % numagents) {
                    A[i][j] = alpha;
                }
            }
        }
        for (j = 0; j < numagents; j++) {
            if (i >= dim - numagents && j === i % numagents) {
                B[i][j] = beta;
            }
        }
    }

    // Gather A, Z, B, and U into their respective matrices
    A = Matrix.create(A);
    B = Matrix.create(B);
    Z = Matrix.create([Z]).transpose();
    var U = Matrix.create([u]).transpose();

    // Compute AZ + BU
    var AZ = A.x(Z);
    var BU = B.x(U);
    var AZpBU = AZ.add(BU);

    // Extract Z[k + 1]
    var start = (k - 1) * numagents;
    var zkp1 = {};
    index = 1;
    _.each(agents, function(agent) {
        zkp1[agent._id] = AZpBU.e(index + start, 1);
        index++;
    });

    // Compute change in values
    var deltavalue = {};
    _.each(agents, function(agent) {
        var id = agent._id;
        var desiredvalue = zkp1[id] * _.last(competitionvalues);
        deltavalue[id] = nnum.Round(desiredvalue - _.last(x[id]), 2);
    });

    console.log(deltavalue);

    cb(deltavalue);
};

var execute_redistribution = function(agents, deltavalues, cb) {
    if (!agents.length) {
        cb();
    }
    else {
        var agent = _.first(agents);
        var id = agent._id;
        var restagents = _.rest(agents);

        if (deltavalues[id] === 0) {
            execute_redistribution(restagents, deltavalues, cb);
        }
        else {
            var last_portfolio = _.last(agent.portfolio);
            if (last_portfolio === undefined) {
                last_portfolio = {composition: {cash00: agent.league.startCash}};
            }
            var next_composition = _.clone(last_portfolio.composition);
            next_composition.cash00 += deltavalues[id];
            agent.portfolio.push({composition: next_composition});
            agent.save(function() {
                execute_redistribution(restagents, deltavalues, cb);
            });
        }
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
                if (_.size(agents) === 0) {
                    cb();
                }
                else {
                    compute_redistribution(agents, function(deltavalues) {
                        execute_redistribution(agents, deltavalues, cb);
                    });
                }
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
