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
                agent: '='
            },
            controller: function($scope) {

                $scope.chartOptions = {
                    xaxis: {
                        mode: 'time',
                        timeformat: '%m/%d %H:%m'
                    },
                    yaxis: {
                        tickFormatter: function(tick) {
                            return $filter('currency')(tick);
                        }
                    }
                };


                $scope.$watch('agent', function(agent) {
                    if (agent === undefined) {
                        return;
                    }
                    var points = _.map(agent.portfoliovalue, function(data) {
                        var key = new Date(data.timestamp);
                        var value = data.totalvalue;

                        return [key.getTime(), value];
                    });
                    $scope.chartData = [{
                        data: points,
                        lines: {
                            show: true
                        },
                        points: {
                            show: true
                        }
                    }];
                });
            }
        };
    }]);
