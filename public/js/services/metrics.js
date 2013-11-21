// Service to calculate metrics given time-series data
angular.module('tdf').factory('Metrics',
    ['_',
    function(_) {
        return {
            score: function(values, metric) {
                var the_score = -1;
                var n = 0;
                var sum_scores = 0;
                var sum_sd = 0;
                var r_f = 1.08;
                var delta = 0;

                // The logic for score: This takes an array of values
		// (a time series of portfolio values), and given the
		// option in metric, will return the score.
                // Metrics include [last, max, average, sharpe, ...].
                if (metric === 'last') {
                    the_score = _.last(values);
                }
                else if (metric === 'max') {
                    the_score = _.max(values);
                }
		else if (metric === 'average') {
                    _.each(values, function(value) {
                        sum_scores += value;
                    });
                    the_score = sum_scores/n;
                }
                else if (metric === 'sharpe') {
                    // Find the mean of the array
                    _.each(values, function(value) {
                        sum_scores += value;
                    });
                    var mean = sum_scores/n;

                    // Find the standard deviation
                    _.each(values, function(value) {
                        sum_sd = Math.pow(value - mean, 2) + sum_sd;
                    });
                    var sd = Math.sqrt(sum_sd/n);

                    // Find the average rate of return
                    for (var i = 0; i < (values.length-1); i++) {
                        delta = delta + (values[i+1] - values[i]);
                    }
                    delta = delta/n;
                    the_score = (delta - r_f)/sd;
                }

                return the_score;
            },
            movingScore: function(values, metric) {
                // The logic for movingScore.
		// Like score, but an array of
		// the moving score for values.

                var arr_score = [];
                var sum_scores = 0;
                var sum_sd = 0;
                var delta = 0;
                var curr_sum = 0;
                var n = _.size(values);
                var sub_array = [];
                var r_f = 1.08;

                if (metric === 'last') {
                    arr_score = values;
                }
                else if (metric === 'max') {
                    for (var j = 0; j < values.length; j++) {
                        arr_score[j] = _.max(values.slice(0,j+1));
                    }
                }
                else if (metric === 'average') {
                    for (var k = 0; k < values.length; k++) {
                        curr_sum = curr_sum + values[k];
                        var the_score = curr_sum/(k+1);
                        arr_score[k] = the_score;
                    }
                }
		else if (metric === 'sharpe') {
                    for (var l = 0; l < (n.length-1); l++) {
                        sub_array = values.slice(0,(l+2));
                        // Find the mean of the array
                        for (var m = 0; m < sub_array.length; m++) {
                            sum_scores = sub_array[m] + sum_scores;
                        }
                        var mean = sum_scores/(l+2);

                        // Find the standard deviation
                        for (var ii = 0; ii < sub_array.length; ii++) {
                            sum_sd = Math.pow((sub_array[ii] - mean), 2) +
                                sum_sd;
                        }
                        var sd = Math.sqrt(sum_sd/sub_array.length);

			// Find the average rate of return
                        for (var jj = 0; jj < sub_array.length - 1; jj++) {
                            delta = delta + (sub_array[jj+1] - sub_array[jj]);
                        }
                        delta = delta/sub_array.length;
                        arr_score[l] = (delta - r_f)/sd;
                    }
                }

                return arr_score;
            }
        };
    }]);
