/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Agent = mongoose.model('Agent'),
    League = mongoose.model('League'),
    _ = require('underscore');

/**
 * Find agent by id
 */
exports.agent = function(req, res, next, id) {
    Agent.load(id, function(err, agent) {
        if (err) {
            return next(err);
        }
        if (!agent) {
            return next(new Agent('Failed to load agent ' + id));
        }
        req.agent = agent;
        next();
    });
};

/**
 * Create an agent
 */
exports.create = function(req, res) {
    var agent = new Agent(req.body);
    agent.user = req.user;

    /*League.load(req.body.leagueid, function(err, league) {
        if (err) return next(err);
        if (!agent) return next(new Agent('Failed to load league ' +
                                            req.body.leagueid +
                                            ' for new agent.'));
        agent.league = league;
    });*/

    agent.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                agent: agent
            });
        }
        console.log('\n\n' + JSON.stringify(agent) + '\n\n');
        res.jsonp(agent);
    });
};

/**
 * Update an agent
 */
exports.update = function(req, res) {
    var agent = req.agent;

    agent = _.extend(agent, req.body);

    agent.save(function(/*err*/) {
        res.jsonp(agent);
    });
};

/**
 * Delete an agent
 */
exports.destroy = function(req, res) {
    var agent = req.agent;

    agent.remove(function(err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(agent);
        }
    });
};

/**
 * Show an agent
 */
exports.show = function(req, res) {
    res.jsonp(req.agent);
};

/**
 * List of agents
 */
exports.all = function(req, res) {
    Agent.find().sort('-created').populate('user', 'name username').
        populate('league', 'name').exec(function (err, agents) {

        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(agents);
        }
    });
};
