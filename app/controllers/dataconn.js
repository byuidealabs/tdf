//=============================================================================
//  Module Dependencies
//=============================================================================

var request = require('request'),
    csv = require('csv'),
    _ = require('underscore');

//=============================================================================
//  Utilities
//=============================================================================

/**
 * Extracts a list of unique symbols in a portfolio composition.
 */
exports.compositionSymbols = function(composition) {
    var cashless = _.omit(composition, 'cash00');
    return _.map(cashless, function(security, symbol) {
        return symbol;
    });
};

/**
 * Extracts a list of unique symbols in the entire agent's history.
 */
exports.agentSymbols = function(portfolio) {

};

//=============================================================================
//  Yahoo Finance
//=============================================================================

/**
 * Gets a table of quotes for the given symbols and executes the callback
 * on the result.
 *
 * http://greenido.wordpress.com/2009/12/22/yahoo-finance-hidden-api/
 */
exports.yahooQuotes = function(req, res, symbols, portfolioValue, cb) {
    var yUrl = 'http://download.finance.yahoo.com/d/quotes.csv' +
               '?f=sb2b3l1e1&s=';
               // Should be symbol, ask, bid, last, error
    if (!symbols || symbols.length === 0) {
        cb(req, res, null, [], portfolioValue);
    }
    else {
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
                cb(req, res, error, null);
            }
            else {
                csv().from.string(body.replace(/<(?:.|\n)*?>/gm, ''))
                    .to.array(function(quotesarray) {

                    var quotes = {};
                    _.each(quotesarray, function(quote) {
                        quotes[_.first(quote).toUpperCase()] = {
                            'ask': quote[1],
                            'bid': quote[2],
                            'last': quote[3],
                            'error': (quote[4] !== 'N/A')
                        };
                    });
                    cb(req, res, null, quotes, portfolioValue);
                });
            }
        });
    }
};

/**
 * Returns the portfolio value.
 *
 * Assumes quotes has a symbol for everything in the current composition.
 */
exports.yahooPortfolioValue = function(composition, quotes, negative_only) {
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
            }
            curr_value = (quotes[symbol].bid * quantity);
        }

        if (!negative_only || curr_value < 0) {
            value += curr_value;
        }
    });
    return value;
};
