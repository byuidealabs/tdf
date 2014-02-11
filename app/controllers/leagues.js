/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    League = mongoose.model('League'),
    _ = require('underscore');

/**
 * Find league by id
 */
exports.league = function(req, res, next, id) {
    League.load(id, function(err, league) {
        if (err || !league) {
            next(new Error('Failed to load league ' + id));
        }
        else {
            req.league = league;
            next();
        }
    });
};

/**
 * Create a league
 */
exports.create = function(req, res) {
    var league = new League(req.body);

    league.save(function(err) {
        if (err) {
            return res.send('users/signin', {
                // TODO verify functionality, may not want this
                errors: err.errors,
                league: league
            });
        }
        else {
            res.jsonp(league);
        }
    });
};

/**
 * Update a league
 */
exports.update = function(req, res) {
    var league = req.league;

    league = _.extend(league, req.body);
    league.leaguePhase = 0;

    league.save(function(/*err*/) {
        res.jsonp(league);
    });
};

/**
 * Delete a league
 */
exports.destroy = function(req, res) {
    var league = req.league;

    league.remove(function(err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(league);
        }
    });
};

/**
 * Show a league
 */
exports.show = function(req, res) {
    res.jsonp(req.league);
};

/**
 * List of leagues
 */
exports.all = function(req, res) {
    League.find().sort('-created').exec(function(err, leagues) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(leagues);
        }
    });
};
