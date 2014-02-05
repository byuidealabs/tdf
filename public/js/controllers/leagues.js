angular.module('tdf.leagues').controller('LeaguesController',
    ['$scope', '$routeParams', '$location', 'Global', 'Utilities', 'Leagues',
    'Agents', '_', '$filter', 'Colors', 'moment',
    function($scope, $routeParams, $location, Global, Utilities, Leagues,
             Agents, _, $filter, Colors) {
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
            ],
            redistribute: [
                {label: 'No', value: false},
                {label: 'Yes', value: true}
            ]
        };

        $scope.getDefault = function() {
            // TODO: Look to see if it is better to get defaults from
            // Schema defaults

            var ms_in_week = 1000*60*60*24*7;

            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);

            var oneweek = new Date();
            oneweek.setTime(today.getTime() + ms_in_week);

            var twoweeks = new Date();
            twoweeks.setTime(today.getTime() + 2 * ms_in_week);

            $scope.league = {
                name: '',

                trialStart: today,
                competitionStart: oneweek,
                competitionEnd: twoweeks,

                isOpenLeague: true,
                maxAgents: 100,
                maxrUserAgents: 100,
                principalAgentRequired: false,
                startCash: 100000,
                leverageLimit: 0,

                redistribute: {
                    on: false,
                    first: today,
                    period: 24,
                    n: 2,
                    beta: 1,
                    alpha: [1, 1]
                }
            };
        };

        $scope.loadEdit = function() {
            if ($routeParams.leagueId === undefined) {
                // Create
                $scope.contentTitle = 'Create a League';
                $scope.submit = $scope.create;
                $scope.getDefault();
            }
            else {
                // Update
                $scope.contentTitle = 'Edit League';
                $scope.submit = $scope.update;
                $scope.findOne();
            }
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

                $scope.leaguechart_lims = {
                    center: league.startCash,
                    up_value: 1,
                    up_order: 1,
                    down_value: 1,
                    down_order: 2
                };
                $scope.setLeagueChartOptions();

                $scope.$watch('league.redistribute.n', function(n) {
                    var alpha;
                    if ($scope.league.redistribute.alpha === undefined) {
                        alpha = [];
                    }
                    else {
                        alpha = $scope.league.redistribute.alpha;
                    }
                    while (alpha.length < n) {
                        alpha.push(0);
                    }
                    alpha = alpha.splice(0, n);
                    $scope.league.redistribute.alpha = alpha;
                });

                Agents.query({
                    league: league._id
                }, function(agents) {
                    $scope.agents = agents;
                });
            });
        };


        $scope.setLeagueChartOptions = function() {
            if ($scope.league === undefined ||
                $scope.leaguechart_lims === undefined) {
                return;
            }

            var actual_limit = function(center, direction, order, value) {
                return center + direction*(value * Math.pow(10, order));
            };

            var league = $scope.league;
            var limits = $scope.leaguechart_lims;

            var lower_limit = actual_limit(limits.center, -1,
                                           limits.down_order,
                                           limits.down_value);
            var upper_limit = actual_limit(limits.center, 1,
                                           limits.up_order,
                                           limits.up_value);

            var trialStart = new Date(league.trialStart).getTime();
            var competitionStart = new Date(league.competitionStart).getTime();
            var competitionEnd = new Date(league.competitionEnd).getTime();
            $scope.chartOptions = {
                xaxis: {
                    mode: 'time',
                    timeformat: '%m/%d %H:%m',
                    panRange: [trialStart, competitionEnd]
                },
                yaxis: {
                    tickFormatter: function(tick) {
                        return $filter('currency')(tick);
                    },
                    zoomRange: [0.05, 5],
                    panRange: [lower_limit, upper_limit],
                    min: lower_limit,
                    max: upper_limit
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
                    hoverable: true,
                    markings: [
                        {
                            xaxis: {
                                to: trialStart
                            },
                            color: 'rgba(210, 50, 45, .5)'
                        },
                        {
                            xaxis: {
                                from: trialStart,
                                to: competitionStart
                            },
                            color: 'rgba(240, 173, 78, .5)'
                        },
                        {
                            xaxis: {
                                from: competitionStart,
                                to: competitionEnd
                            },
                            color: 'rgba(71, 164, 71, .5)'
                        },
                        {
                            xaxis: {
                                from: Date.now(),
                                to: Date.now()
                            },
                            color: 'rgb(210, 50, 45)'
                        }
                    ]
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

        $scope.$watch('leaguechart_lims', function() {
            $scope.setLeagueChartOptions();
        }, true);


    }]);
