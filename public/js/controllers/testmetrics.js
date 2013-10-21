angular.module('tdf').controller('TestMetricsController',
    ['$scope', 'Metrics',
    function ($scope, Metrics) {
        $scope.test1 = {
            metric : 'max',
            values : [10, 7, 12, 8],
            expected_score : 12,
            expected_moving : [10, 10, 12, 12]
        };

        $scope.testScore = function(values, metric) {
            return Metrics.score(values, metric);
        };

        $scope.testMovingScore = function(values, metric) {
            return Metrics.movingScore(values, metric);
        };
    }]);
