angular.module('tdf.leagues').controller('LeaguesController',
    ['$scope', '$routeParams', '$location', 'Global', 'Utilities', 'Leagues',
    'Agents', '_', '$filter',
    function($scope, $routeParams, $location, Global, Utilities, Leagues,
             Agents, _, $filter) {
        $scope.global = Global;

        $scope.options = {
            isOpenLeague: [
                {label: 'Open', value: true},
                {label: 'Closed (Coming Soon)', value: false}
            ],
            eligibleAgents: [
                {label: 'All of the user\'s agents are eligible',
                    value: false},
                {label: 'User must select one eligible agent',
                    value: true}
            ]
        };

        $scope.getDefault = function() {
            // TODO: Look to see if it is better to get defaults from
            // Schema defaults
            $scope.league = {
                name: '',
                isOpenLeague: true,
                maxAgents: 100,
                maxrUserAgents: 100,
                principalAgentRequired: false,
                startCash: 100000,
                shortSellLimit: 0,
                leverageLimit: 0
            };
        };

        $scope.create = function() {
            var league = new Leagues($scope.league);

            league.$save(function(response) {
                $location.path('leagues/' + response._id);
            });
        };

        $scope.remove = function(league) {
            // TODO decide how to handle agents in deleted leagues
            league.$remove();

            if ($scope.leagues) {
                // Needed if called from list.html
                Utilities.spliceByObject($scope.leagues, league);
            }

            $location.path('leagues/');
        };

        $scope.update = function() {
            var league = $scope.league;

            league.$update(function() {
                $location.path('leagues/' + league._id);
            });
        };

        $scope.find = function(query) {
            Leagues.query(query, function(leagues) {
                $scope.leagues = leagues;
            });
        };

        $scope.findOne = function() {
            Leagues.get({
                leagueId: $routeParams.leagueId
            },
            function(league) {
                $scope.league = league;
                $scope.leagues = [league];
                Agents.query(function(agents) {
                    $scope.agents = agents;
                });
            });
        };

        $scope.chartOptions = {
            xaxis: {
                mode: 'time',
                timeformat: '%Y/%m/%d'
            },
            yaxis: {
                tickFormatter: function(tick) {
                    return $filter('currency')(tick);
                }
            },
            legend: {
                show: true,
                container: '#chart-legend',
                noColumns: 2
            }
        };

        $scope.$watch('agents', function(agents) {
            var chartData = [];
            _.each(agents, function(agent) {
                var points = _.map(agent.portfoliovalue, function(data) {
                    var key = new Date(data.timestamp);
                    var value = data.totalvalue;

                    return [key.getTime(), value];
                });
                var data = {
                    data: points,
                    lines: {
                        show: true
                    },
                    points: {
                        show:false
                    }
                };
                chartData.push(data);
            });
            $scope.chartData = chartData;
        });

    }]);
