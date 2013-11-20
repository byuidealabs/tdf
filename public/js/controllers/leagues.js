angular.module('tdf.leagues').controller('LeaguesController',
    ['$scope', '$routeParams', '$location', 'Global', 'Utilities', 'Leagues',
    'Agents', '_', '$filter', 'Colors', 'moment',
    function($scope, $routeParams, $location, Global, Utilities, Leagues,
             Agents, _, $filter, Colors, moment) {
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

                $scope.setLeagueChartOptions(league);

                // Set up trial phase start date/time
                var momentTrialStart = moment.parseZone(
                    league.trialStart.toString());
                $scope.trialStart = {
                    Day: momentTrialStart.format('YYYY-MM-DD'),
                    Time: momentTrialStart.format('HH:mm')
                };

                Agents.query(function(agents) {
                    $scope.agents = agents;
                });
            });
        };


        $scope.setLeagueChartOptions = function(league) {
            var league_start = new Date(league.created).getTime(); // TODO
            $scope.chartOptions = {
                xaxis: {
                    mode: 'time',
                    timeformat: '%m/%d %H:%m',
                    panRange: [league_start, Date.now()]
                },
                yaxis: {
                    tickFormatter: function(tick) {
                        return $filter('currency')(tick);
                    },
                    zoomRange: [0.05, 5],
                    panRange: false
                },
                zoom: {
                    interactive: true
                },
                pan: {
                    interactive: true
                },
                legend: {
                    show: true,
                    container: '#chart-legend',
                    noColumns: 2
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

        $scope.$watch('agents', function(agents) {
            var chartData = [];
            var index = 0;
            _.each(agents, function(agent) {
                var points = _.map(agent.portfoliovalue, function(data) {
                    var key = new Date(data.timestamp);
                    var value = data.totalvalue;

                    return [key.getTime(), value];
                });
                var data = {
                    data: points,
                    color: Colors.atindex(index),
                    lines: {
                        show: true
                    },
                    points: {
                        show:false
                    },
                    label: agent.name + ' (' + agent.user.username + ')'
                };
                chartData.push(data);

                index++;
            });
            $scope.chartData = chartData;
        });

        $scope.$watch('trialStart', function(trialStart) {
            if (!trialStart || !trialStart.Day || !trialStart.Time) {
                return;
            }
            $scope.league.trialStart = new Date(trialStart.Day + ' ' +
                                                trialStart.Time + ' GMT');
        }, true);

    }]);
