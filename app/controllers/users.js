/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Agent = mongoose.model('Agent'),
    _ = require('underscore');

/**
 * Auth callback
 */
exports.authCallback = function(req, res, next) {
    res.redirect('/');
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
    res.render('users/signup', {
        title: 'Sign up',
        user: new User()
    });
};

/**
 * Logout
 */
exports.signout = function(req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function(req, res) {
    res.redirect('/');
};

/**
 * Create user
 */
exports.create = function(req, res) {
    var user = new User(req.body);

    user.provider = 'local';
    user.save(function(err) {
        if (err) {
            return res.render('users/signup', {
                errors: err.errors,
                user: user
            });
        }
        req.logIn(user, function(err) {
            if (err) return next(err);
            return res.redirect('/');
        });
    });
};

/**
 *  Show profile
 */
exports.show = function(req, res) {
    var profile = public_profile(req.profile);
    Agent.find({user: profile.id}, 'name description league cash')
         .populate('league', 'name')
         .exec(function(err, agents) {
                profile.agents = agents;
                console.log(JSON.stringify(profile));
                res.jsonp(profile);
         });
};

/**
 * Send User
 */
exports.me = function(req, res) {
    res.jsonp(req.user || null);
};

exports.profile = function(req, res) {
    res.jsonp(req.user);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};

/**
 * List of Users
 */
exports.all = function(req, res) {
    User.find().exec(function(err, users) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(public_profiles(users));
        }
    });
};

/**
 * Updates the user's profile
 */
exports.update = function(req, res) {
    var user = req.user;

    user = _.extend(user, req.body);

    user.save(function(err) {
        res.jsonp(user);
    });
};

function public_profiles(users) {
    return _.map(users, public_profile);
}

function public_profile(user) {
    profile = _.pick(user, 'id', 'username');
    return profile;
}
