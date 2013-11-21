angular.module('tdf').directive('agentList',
    ['Colors',
    function(Colors) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentlist.html',
            scope: false,
            controller: function($scope) {
                $scope.colors = Colors;
            }
        };
    }])
.directive('agentStatus',
    ['_', '$filter', 'Colors',
    function(_, $filter, Colors) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentstatus.html',
            scope: {
                agent: '=',
                color: '='
            },
            controller: function($scope) {

                $scope.$watch('agent', function(agent) {
                    if (agent === undefined) {
                        return;
                    }

                    var color = $scope.color || Colors.atindex(0);

                    var points = _.map(agent.portfoliovalue, function(data) {
                        var key = new Date(data.timestamp);
                        var value = data.totalvalue;

                        return [key.getTime(), value];
                    });

                    $scope.chartData = [{
                        data: points,
                        color: color,
                        lines: {
                            show: true
                        },
                        points: {
                            show: false
                        }
                    }];
                });

                $scope.chartOptions = {
                    xaxis: {
                        mode: 'time',
                        timeformat: '%m/%d %H:%m'
                    },
                    yaxis: {
                        tickFormatter: function(tick) {
                            return $filter('currency')(tick);
                        }
                    },
                    grid: {
                        hoverable: true
                    },
                    tooltip: true,
                    tooltipOpts: {
                        content: '%y on %x',
                        xDateFormat: '%b %e, %Y %I:%M:%S %p'
                    }
                };

            }
        };
    }]);
