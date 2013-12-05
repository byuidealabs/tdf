/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('underscore');

/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
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
exports.session = function(req, res, next) {
    next();
};

/**
 * Detects whether the user has a duplicate of the given property.
 */
var detect_duplicate_user_prop = function(user, property, cb) {
    var query = {};
    query[property] = user[property];
    User.findOne(query)
        .where('_id').ne(user.id)
        .exec(function(err, dup_user) {
            if (dup_user) {
                cb(true);
            }
            else {
                cb(false);
            }
        });
};

/**
 * Detects whether a user with duplicate information exists.
 */
var detect_duplicate_user = function(user, cb) {
    detect_duplicate_user_prop(user, 'username', function(dup_username) {
        if (dup_username) {
            cb(true, 'Another user with this user name already exists. ' +
               'Please choose another user name.');
        }
        else {
            detect_duplicate_user_prop(user, 'email', function(dup_email) {
                if (dup_email) {
                    cb(true, 'Another user with this email already exists. ' +
                       'Please choose another email.');
                }
                else {
                    cb(false, '');
                }
            });
        }
    });
};

/**
 * Create user
 */
exports.create = function(req, res, next) {
    var user = new User(req.body);

    detect_duplicate_user(user, function(has_duplicate, message) {
        if (has_duplicate) {
            return res.send(500, {
                flash: message
            });
        }
        user.save(function(err) {
            if (err) {
                return res.send(500, {
                    flash: 'An unkonwn error has occured.'
                });
            }
            req.user = user;
            next();
        });

    });
};

/**
 *  Show profile
 */
exports.show = function(req, res) {
    var profile = _.pick(req.profile, 'id', 'username');
    res.jsonp(profile);
};

/**
 * Send User
 */
exports.me = function(req, res) {
    res.jsonp(req.user || null);
};

exports.profile = function(req, res) {
    var profile = _.pick(req.user, '_id', 'name', 'username', 'email');
    res.jsonp(profile);
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
            if (err || !user) {
                next(new Error('Failed to load User ' + id));
            }
            else {
                req.profile = user;
                next();
            }
        });
};

/**
 * List of Users
 */
exports.all = function(req, res) {
    User.find({}, 'username').exec(function(err, users) {
        if (err) {
            res.render('error', {
                status: 500
            });
        }
        else {
            res.jsonp(users);
        }
    });
};

/**
 * Updates the user's profile
 */
exports.update = function(req, res) {
    var user = req.user;
    user = _.extend(user, req.body);

    detect_duplicate_user(user, function(has_duplicate, message) {
        if (has_duplicate) {
            return res.send(500, {
                flash: message
            });
        }

        user.save(function(/*err*/) {
            res.jsonp(user);
        });
    });
};
