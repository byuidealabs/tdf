angular.module('tdf.histories').controller('HistoriesController',
    ['$scope', '$routeParams', '$filter', 'Histories', '_',
    function($scope, $routeParams, $filter, Histories, _) {

        $scope.find = function(query) {
            Histories.query(query, function(securities) {
                $scope.securities = securities;
            });
        };

        $scope.findOne = function() {
            $scope.chartLoading = true;
            $scope.symbol = $routeParams.ticker;
            Histories.get({
                ticker: $routeParams.ticker
            }, function(security) {
                $scope.security = security;
            });
        };

        $scope.setChartOptions = function() {
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
                    content: '%s: %y on %x',
                    xDateFormat: '%b %e, %Y %I:%M:%S %p'
                }
            };
        };

        $scope.$watch('security', function(security) {
            if (security === undefined) {
                return;
            }

            $scope.setChartOptions();

            var chartData = [];
            var to_plot = {
                'last': 'Last Price',
                'ask': 'Ask Price',
                'bid': 'Bid Price'
            };

            _.each(to_plot, function(title, name) {
                var points = _.map(security[name], function(value, timestamp) {
                    var date = new Date(timestamp);
                    return [date.getTime(), value];
                });
                var data = {
                    data: points,
                    lines: {show: true},
                    points: {show: false},
                    label: title
                };
                chartData.push(data);
            });
            $scope.chartData = chartData;
            $scope.chartLoading = false;
        });
    }]);
