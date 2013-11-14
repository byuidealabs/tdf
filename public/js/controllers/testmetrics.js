angular.module('tdf').controller('TestMetricsController',
    ['$scope', 'Metrics',
    function ($scope, Metrics) {

        $scope.tests = [
            {
                metric : 'max',
                values : [10, 7, 12, 8],
                expected_score : 12,
                expected_moving : [10, 10, 12, 12]
            },
            {
                metric : 'last',
                values : [10, 7, 12, 8],
                expected_score : 8,
                expected_moving : [10, 7, 12, 8]
            }, 
	    {
                metric : 'average',
                values : [10, 7, 12, 8],
                expected_score : 9.25,
                expected_moving : [10, 8.5, 9.67, 9.25]
            },           
	    {
                metric : 'sharpe',
                values : [10, 7, 12, 8],
                expected_score : -1,
                expected_moving : [-1,-1,-1,-1]
            },
        ];

        $scope.testScore = function(values, metric) {
            return Metrics.score(values, metric);
        };

        $scope.testMovingScore = function(values, metric) {
            return Metrics.movingScore(values, metric);
        };
    }]);
