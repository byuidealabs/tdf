//=============================================================================
//  Module Dependencies
//=============================================================================

var mongoose = require('mongoose'),
    Tick = mongoose.model('Tick'),
    dataconn = require('./dataconn'),
    Agent = mongoose.model('Agent'),
    League = mongoose.model('League'),
    _ = require('underscore'),
    numjs = require('numjs'),
    nnum = numjs.nnum,
    async = require('async');

//=============================================================================
//  Helper functions
//=============================================================================

var sandp500 = require('../data/sandp500.js');
var SYMBOLS = sandp500.sandp500_list;

var securities_list = function(quotes) {
    var securities = [];
    _.each(quotes, function(data, symbol) {
        var security = {
            symbol: symbol,
            ask: data.ask,
            bid: data.bid,
            last: data.last,
            error: data.error
        };
        securities = _.union(securities, [security]);
    });
    return securities;
};

var promote_leagues = function(cb) {
    console.log('promoting leagues');

    cb(null, 'leagues promoted');
};

var update_agent_portfolio = function(agent, quotes, cb) {
    if (agent.league.leaguePhase === 1 || agent.league.leaguePhase === 2) {
        var curr_portfolio = _.last(agent.portfolio) ||
            {composition: {cash00: agent.league.startCash}};
        var new_composition = _.clone(curr_portfolio.composition);
        var composition = {};
        var totalvalue = dataconn.portfolioValue(new_composition,
                                                 quotes, false);

        var neg_value = -1*dataconn.portfolioValue(new_composition, quotes,
                                                true);
        var max_neg = totalvalue * agent.league.leverageLimit;
        if (totalvalue <= 0) {
            console.log('Value of agent ' + agent.name +
                        ' has reached 0. Freezing account.');
            // TODO
        }
        else if (neg_value > max_neg) {
            // Leverage limit exceeded, sell off random securities until
            // either the leverage limit is within acceptable bounds or the
            // value of the portfolio reaches zero.

            console.log('Leverage limit exceeded on agent ' + agent.name +
                        '. Selling off securities.');
            var sell_method = 'bid'; //TODO

            var curr_neg_value = neg_value;
            while (curr_neg_value > max_neg) {
                // Keep selling random securities until within leverage
                // limit or until there is nothing left to sell

                // Choose random security
                var symbols = dataconn.compositionSymbols(new_composition,
                                                        true);
                if (_.size(symbols) === 0) {
                    break;
                }
                var rdm = Math.floor(Math.random()*symbols.length);
                var symbol = symbols[rdm];

                // Sell 1 share of security, cleaning list if no more of
                // that security exists
                var price = dataconn.get_security_value(quotes, symbol,
                                                        sell_method);

                new_composition.cash00 += price;
                new_composition[symbol] -= 1;

                if (new_composition[symbol] === 0) {
                    delete new_composition[symbol];
                }

                // Recompute neg_value and max_neg
                curr_neg_value = -1 * dataconn.portfolioValue(
                    new_composition, quotes, true);
            }
            agent.portfolio.push({composition: new_composition});
        }

        totalvalue = 0; //reset for new computation
        _.each(new_composition, function(quantity, symbol) {
            // TODO move into dataconn
            if (symbol === 'cash00') {
                totalvalue += quantity;
            }
            else {
                var pricetype = 'bid';  //TODO get from league

                if (quotes[symbol] === undefined) {
                    console.log('Ticks: Undefined symbol ' + symbol);
                    console.log(JSON.stringify(new_composition));
                }
                else {
                    var sellprice = quotes[symbol][pricetype];
                    var securityprice = nnum.Round(sellprice, 2) *
                        quantity;

                    totalvalue += securityprice;
                    composition[symbol] = securityprice;
                }
            }
        });

        agent.portfoliovalue.push({
            composition: composition,
            totalvalue: totalvalue
        });

        agent.save(function() {
            cb(null, 'porftolio of ' + agent.name + ' updated');
        });
    }
    else {
        cb(null, 'no need to update portfolio of ' + agent.name);
    }
};

var update_agents = function(cb)  {
    console.log('updating agents');

    dataconn.yahooQuotes(SYMBOLS, function(err, quotes) { // TODO smart symbols
        var securities = securities_list(quotes);
        var tick = new Tick({securities: securities});

        async.parallel([
            function (callback) {
                tick.save(function(err) {
                    callback(err, 'tick saved');
                });
            },
            function (callback) {
                Agent.find()
                    .populate('league', 'startCash leverageLimit leaguePhase')
                    .exec(function(err, agents){

                    if (err) {
                        callback(err, 'agents failed');
                    }
                    else {
                        var tocall = [];
                        _.each(agents, function(agent) {
                            tocall.push(function(inner_callback) {
                                update_agent_portfolio(
                                    agent, quotes, function(err, results) {
                                    inner_callback(err, results);
                                });
                            });
                        });
                        async.parallel(tocall, function(err, results) {
                            callback(err, results);
                        });
                    }
                });
            }
        ],
        function (err, results) {
            cb(err, results);
        });
    });
};

//=============================================================================
//  Exports
//=============================================================================

// TODO grab from leagues

var execute_tick = function(cb) {
    async.series([
        promote_leagues,
        update_agents
    ],
    function(err, results) {
        console.log('running tick: ');
        console.log('tick error: ' + err);
        console.log('tick results:');
        console.log(results);
        cb();
    });
};

/**
 * Execute a tick (use for an internal call)
 */
exports.tick = function(cb) {
    execute_tick(cb);
};

/**
 * Executes a tick (use for a url call)
 */
exports.maketick = function(req, res) {
    execute_tick(function() {
        res.jsonp('Ticked!');
    });
};

/**
 * Gets the historical prices
 */
exports.historical = function(req, res) {
    // TODO filter time span depending on league

    var allsymbols = SYMBOLS; //TODO
    if (_.contains(allsymbols, req.symbol)) {
        Tick.securityHistory(req.symbol, function(values) {
            res.jsonp(values);
        });
    }
    else {
        res.jsonp({
            error: {
                code: 101,
                message: 'Unknown security with symbol ' + req.symbol + '.'
            }
        });
    }



    /*Tick.historical(function(values) {
        res.jsonp(values);
    });*/
};

exports.symbols = function(req, res) {
    // TODO see if league is passed, filter based on league
    res.jsonp(SYMBOLS);
};

exports.currentstatus = function(req, res) {
    var allsymbols = SYMBOLS; //TODO
    var select = 'all';
    if (req.query.select !== undefined) {
        select = req.query.select;
    }
    Tick.currentStatus(allsymbols, select, function(stats) {
        res.jsonp(stats);
    });
};

exports.allhistories = function(req, res) {
    var allsymbols = SYMBOLS; //TODO
    var n = 12;
    var select = 'all';

    if (req.query.n !== undefined) {
        n = parseInt(req.query.n, 10);
    }
    if (req.query.select !== undefined) {
        select = req.query.select;
    }

    Tick.allHistories(allsymbols, n, select, function(histories) {
        res.jsonp(histories);
    });
};
