// Service to calculate metrics given time-series data
angular.module('tdf').factory('Metrics',
    ['_',
    function(_) {
        return {
            score: function(values, metric) {
                // TODO (Vasu): create the logic for score
                // This should take an array of values (a time series of
                // portfolio values), and given the option in metric,
                // will return the score.
                // metric in [last, max, average, sharpe, ...]

                console.log('score called with metric \'' + metric +
                            '\' and values [' + values + '].');
                // A demonstration of underscore.js
                console.log('underscore demonstration. Each item in values ' +
                            'will be logged here: ');
                _.each(values, function(value){
                    console.log(value);
                });

                return -1;
            },
            movingScore: function(values, metric) {
                // TODO (Vasu): create the logic for movingScore
                // Like score, but an array of the moving score for values

                console.log('score called with metric \'' + metric +
                            '\' and values [' + values + '].');

                return [-1, -1, -1, -1];
            }
        };
    }]);
