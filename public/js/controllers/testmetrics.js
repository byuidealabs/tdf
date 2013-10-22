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
            }
        ];

        $scope.testScore = function(values, metric) {
            return Metrics.score(values, metric);
        };

        $scope.testMovingScore = function(values, metric) {
            return Metrics.movingScore(values, metric);
        };
    }]);
