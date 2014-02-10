/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs'),
    passport = require('passport'),
    logger = require('mean-logger'),
    Agenda = require('agenda');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//Load configurations
//if test env, load example file
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config'),
    auth = require('./config/middlewares/authorization'),
    mongoose = require('mongoose');

//Bootstrap db connection
var db = mongoose.connect(config.db);

//Bootstrap models
var models_path = __dirname + '/app/models';
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js$|coffee$)/.test(file)) {
                require(newPath);
            }
        } else if (stat.isDirectory()) {
            walk(newPath);
        }
    });
};
walk(models_path);

//bootstrap passport config
require('./config/passport')(passport);

var app = express();

//express settings
require('./config/express')(app, passport);

//Bootstrap routes
require('./config/routes')(app, passport, auth);

//Start the app by listening on <port>
var port = config.port;
app.listen(port);
console.log('Express app started on port ' + port);

//Initializing logger
logger.init(app, passport, mongoose);

//expose app
exports = module.exports = app;

// Initialize agenda
// TODO move database name to config/env
var agenda = new Agenda();
agenda.database('mongodb://localhost/tdf-dev-agenda', 'agendaJobs');

// Scraper Functionality:
var ticks = require('./app/controllers/ticks');
var tickrate = '0-59/30 * * * *';

agenda.define('scrape yahoo', {lockLifetime: 10000}, function(job, done) {
    console.log('Scraping new Data (new ticker).');
    ticks.tick(function() {
        var now = new Date();
        console.log('\t' + now.toUTCString() + ': Data scraped.');
        done();
    });
});

agenda.every(tickrate, 'scrape yahoo');
agenda.start();
