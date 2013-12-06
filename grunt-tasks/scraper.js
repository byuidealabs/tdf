/*
 * grunt-scraper
 * https://github.com/nwoodbury/tdf
 *
 * Copyright (c) 2013 Nathan Woodbury
 * Licensed under the MIT license.
 */

'use strict';

var request = require('request');

var get_time_msg = function(timeout_ms) {
    var timeout_s = timeout_ms / 1000;
    var time_msg = '';
    if (timeout_s < 60) {
        time_msg = timeout_s + ' second(s)';
    }
    else if (timeout_s < 360) {
        time_msg = (timeout_s / 60) + ' minute(s)';
    }
    else {
        time_msg = (timeout_s / 360) + ' hour(s)';
    }
    return time_msg;
};

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerTask('scraper',
                            'Scrapes data from yahoo finance, storing it' +
                            ' in MongoDB', function() {
        console.log('entered scraper!!!!!!');
        var done = this.async();
        var options = this.options();
        var timeout_ms;

        grunt.config.requires('nodemon');

        if (!options.tickrate) {
            timeout_ms = 1000;
        }
        else {
            timeout_ms = 1000 * options.tickrate;
        }

        request('http://localhost:3000/tick', function() {
            grunt.log.writeln('Data scraped. Next scrape in ' +
                              get_time_msg(timeout_ms) + '.');
            setTimeout(function() {
                done();
                grunt.task.run('scraper');
            }, timeout_ms);
        });
    });
};
