angular.module('tdf').directive('agentList',
    [function() {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentlist.html',
            scope: false
        };
    }])
.directive('agentStatus',
    ['_', '$filter',
    function(_, $filter) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentstatus.html',
            scope: {
                status: '='
            },
            controller: function($scope) {

                $scope.chartOptions = {
                    xaxis: {
                        mode: 'time',
                        timeformat: '%Y/%m/%d'
                    },
                    yaxis: {
                        tickFormatter: function(tick) {
                            return $filter('currency')(tick);
                        }
                    }
                };


                $scope.$watch('status', function(v) {
                    if (v === undefined) {
                        return;
                    }
                    var data = _.pairs(v.history);
                    data = _.map(data, function(pair) {
                        var key = new Date(pair[0]);
                        var value = pair[1];

                        return [key.getTime(), value];
                    });
                    data = data.reverse();
                    $scope.chartData = [{
                        data: data,
                        lines: {
                            show: true
                        }

                    }];
                });
            }
        };
    }]);
