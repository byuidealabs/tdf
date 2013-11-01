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
		if (metric == "last") 
		{
		    the_score = _.last(values);
		}
		else if (metric == "max")
		{
		    the_score = _.max(values);
		}
		else if (metric == "average")
		{
		    n = _.size(values);
		    for (i = 0; i < n; i++)
		    {
	 	        sum_scores = values[i] + sum_scores;
		    }
		    the_score = sum_scores/n;
		}
		else if (metric == "sharpe")
		{
		    // Find the mean of the array
		    n = _.size(values);
		    for (i = 0; i < n; i++)
		    {
	 	        sum_scores = values[i] + sum_scores;
		    }
		    mean = sum_scores/n;
		    
		    // Find the standard deviation
		    for (j = 0; j < n; j++)
		    {
			sum_sd = Math.pow(values[j] - mean,2) + sum_sd; 
		    }
		    sd = Math.sqrt(sum_sd/n);

		    // Find the average rate of return
		    for (k = 0; k < (n-1); k++)
		    {
			delta = delta + (values[k+1] - values[k]); 
		    }
		    delta = delta/n;
		    the_score = (delta - r_f)/sd;
		}    

                /*console.log('score called with metric \'' + metric +
                            '\' and values [' + values + '].');
                // A demonstration of underscore.js
                console.log('underscore demonstration. Each item in values ' +
                            'will be logged here: ');
                _.each(values, function(value){
                    console.log(value);
                });*/

                return the_score;
            },
            movingScore: function(values, metric) {
                // The logic for movingScore.
		// Like score, but an array of 
		// the moving score for values.

		var arr_score = new Array();
		var sum_scores = 0;
		var sum_sd = 0;
		var delta = 0;	
		var curr_sum = 0;
 		var n = _.size(values);	
		var sub_array = new Array();
		var r_f = 1.08;

		if (metric == "last") 
		{
		    arr_score = values;
		}
		else if (metric == "max")
		{
		    for (i = 0; i < n; i++)
		    {
			arr_score[i] = _.max(values.slice(0,i+1));
		    }
		}
		else if (metric == "average")
		{
		    for (i = 0; i < n; i++)
		    {
			curr_sum = curr_sum + values[i];
			the_score = curr_sum/(i+1);
			arr_score[i] = the_score; 	
		    }
		}
		else if (metric == "sharpe")
		{
		    n = _.size(values);
		    for (l = 0; l < (n-1); l++)
		    {
			sub_array = values.slice(0,(l+2));
			sub_n = _.size(sub_array);
		        // Find the mean of the array
			for (i = 0; i < sub_n; i++)
			{
		 	    sum_scores = sub_array[i] + sum_scores;
			}
			mean = sum_scores/(l+2);

			// Find the standard deviation
			for (j = 0; j < sub_n; j++)
			{
			    sum_sd = Math.pow((sub_array[j] - mean),2) + sum_sd; 
			}
			sd = Math.sqrt(sum_sd/sub_n);

			// Find the average rate of return
			for (k = 0; k < sub_n - 1; k++)
			{
			    delta = delta + (sub_array[k+1] - sub_array[k]);
			}
			delta = delta/sub_n;
			console.log(delta);
			arr_score[l] = (delta - r_f)/sd;
		    }
		}
                /*console.log('score called with metric \'' + metric +
                            '\' and values [' + values + '].');*/

                return arr_score;
            }
        };
    }]);
