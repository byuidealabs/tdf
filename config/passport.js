var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    User = mongoose.model('User'),
    _ = require('underscore'),
    admins = require('./admins.json');


module.exports = function(passport) {
    //Serialize sessions
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        //User.findOne({
        //    _id: id
        //}, function(err, user) {
        //    done(err, user);
        //});
        User.findOne({
            _id: id
        }).exec(
            function(err, user) {
                if (_.contains(admins, user.username)) {
                    user.isAdmin = true;
                }
                done(err, user);
            });
    });

    //Use local strategy
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, done) {
            User.findOne({
                email: email
            }, function(err, user) {
                if (err) {
                    console.log('error');
                    return done(err);
                }
                if (!user) {
                    console.log('unknown user');
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!user.authenticate(password)) {
                    console.log('invalid password');
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
                console.log('success');
                return done(null, user);
            });
        }
    ));
};
