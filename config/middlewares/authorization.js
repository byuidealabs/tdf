/**
 * List of admin user names
 */
var admins = require('../admins.json'),
    _ = require('underscore');

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

exports.requiresAdmin = function(req, res, next) {
    if (!_.contains(admins, req.user.username)) {
        return res.send(401, 'User is not authorized. Admin access required');
    }
    next();
};

/**
 * User authorizations routing middleware
 */
exports.user = {
    hasAuthorization: function(req, res, next) {
        if (req.profile.id !== req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};

/**
 * Article authorizations routing middleware
 */
exports.article = {
    hasAuthorization: function(req, res, next) {
        if (req.article.user.id !== req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};

/**
 * Agent authorizations routing middleware
 */
exports.agent = {
    hasAuthorization: function(req, res, next) {
        var userauthorized = (req.user !== undefined &&
                              req.agent.user.id === req.user.id &&
                              !_.contains(req.body, 'apikey'));
        var sent_key;
        if (req.method === 'GET') {
            sent_key = req.query.apikey;
        }
        else {
            sent_key = req.body.apikey;
        }
        var apikeyauthorized = (sent_key === req.agent.apikey);
        if (!(userauthorized || apikeyauthorized)) {
            return res.send(401, 'Not authorized to operate on agent.');
        }
        next();
    }
};
