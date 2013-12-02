//=============================================================================
//  Module Dependencies
//=============================================================================

var request = require('request'),
    csv = require('csv'),
    _ = require('underscore');

var yUrl = 'http://download.finance.yahoo.com/d/quotes.csv' +
           '?f=sb2b3l1e1&s=';
           // Should be symbol, ask, bid, last, error
var DISSECT_SIZE = 200; // 200 is the maximum size allowed by yahoo

//=============================================================================
//  Utilities
//=============================================================================

/**
 * Extracts a list of unique symbols in a portfolio composition.
 */
exports.compositionSymbols = function(composition, only_positive) {
    var cashless = _.omit(composition, 'cash00');
    if (only_positive) {
        _.each(cashless, function(quantity, symbol) {
            if (quantity <= 0) {
                delete cashless[symbol];
            }
        });
    }
    return _.map(cashless, function(quantity, symbol) {
        return symbol;
    });
};

/**
 * Extracts a list of unique symbols in the entire portfolio's history.
 */
exports.agentSymbols = function(portfolio) {
    var symbols = [];
    _.each(portfolio, function(instance) {
        symbols = _.union(symbols,
                          exports.compositionSymbols(instance.composition));
    });
    return symbols;
};

/**
 * Looks up the price of the security represented by symbol in quotes.
 *
 * Scheme defines the price, and is one of 'bid', 'ask', and 'last'.
 *
 * If a lookup fails with the given scheme, a second lookup occures with
 * scheme of last. If that fails, an error is thrown (the symbol does not
 * exist in yahoo finance)
 */
exports.get_security_value = function(quotes, symbol, scheme) {
    symbol = symbol.toUpperCase();

    if (quotes[symbol] === undefined) {
        throw {
            'msg': 'Could not look up symbol ' + symbol,
            'code': 3
        };
    }
    if (quotes[symbol][scheme] === undefined) {
        throw {
            'msg': 'Could not look up ' + scheme + ' of security ' + symbol,
            'code': 4
        };
    }

    var value = quotes[symbol][scheme];
    var error = quotes[symbol].error;
    if (error && error !== 'false') {
        throw {
            'msg': 'Trade on unknown or invalid security ' + symbol,
            'code': 2,
        };
    }
    else {
        return parseFloat(value);
    }
};

//=============================================================================
//  Yahoo Finance
//=============================================================================

/**
 * Given an array of symbols, returns an array containing arays of symbols of
 * size size (or possibly less in the case of the last array).
 */
var dissect_symbols = function(symbols, size) {
    var dissected = [];
    for (var i = 0; i < symbols.length; i += size) {
        dissected.push(symbols.slice(i, i + size));
    }
    return dissected;
};

var query_yahoo = function(symbols_list, quotes, cb) {
    if (!symbols_list.length) {
        cb(null, quotes);
    }
    else {
        var symbols = _.first(symbols_list);
        var rest_symbols = _.rest(symbols_list);

        var symbol_str = _.reduce(symbols, function(memo, symbol) {
            var pre = '';
            if (symbol.length) {
                pre = '+';
            }
            return memo + pre + symbol;
        });
        var url = yUrl + symbol_str;

        request(url, function(error, rst, body) {
            if (error) {
                cb(error, null);
            }
            else {
                csv().from.string(body.replace(/<(?:.|\n)*?>/gm, ''))
                    .to.array(function(quotesarray) {
                    _.each(quotesarray, function(quote) {
                        var error = (quote[4] !== 'N/A');

                        var last = quote[3];
                        if (isNaN(last) || parseFloat(last) === 0) {
                            last = 0;
                            error = true;
                        }
                        var ask = quote[1];
                        if (isNaN(ask) || parseFloat(ask) === 0) {
                            ask = last;
                        }
                        var bid = quote[2];
                        if (isNaN(bid) || parseFloat(bid) === 0) {
                            bid = last;
                        }

                        quotes[quote[0].toUpperCase()] = {
                            'ask': ask,
                            'bid': bid,
                            'last': last,
                            'error': error
                        };
                    });
                    query_yahoo(rest_symbols, quotes, cb);
                });
            }
        });
    }
};

/**
 * Gets a table of quotes for the given symbols and executes the callback
 * on the result.
 *
 * http://greenido.wordpress.com/2009/12/22/yahoo-finance-hidden-api/
 */
exports.yahooQuotes = function(symbols, cb) {
        // TODO Simplify (less arguments, don't need to reshape final
    if (!symbols || symbols.length === 0) {
        cb(null, []);
    }
    else {
        var symbols_list = dissect_symbols(symbols, DISSECT_SIZE);

        var quotes = {};
        query_yahoo(symbols_list, quotes, function(error, quotes) {
            cb(error, quotes);
        });
    }
};

/**
 * Returns the portfolio value.
 *
 * Assumes quotes has a symbol for everything in the current composition.
 */
exports.portfolioValue = function(composition, quotes, negative_only) {
    var value = 0;
    var curr_value = 0;
    _.each(composition, function(quantity, symbol) {
        if (symbol === 'cash00') {
            curr_value = quantity;
        }
        else {
            // TODO error check symbol existing in quotes
            // TODO error check symbol has a quantity
            // TODO tie in value computation with admin (don't necessarily be
            //      bid
            if (quotes[symbol] === undefined) {
                console.log('Undefined symbol ' + symbol);
                return 0;
            }
            curr_value = (quotes[symbol].bid * quantity);
        }

        if (!negative_only || curr_value < 0) {
            value += curr_value;
        }
    });
    return value;
};
