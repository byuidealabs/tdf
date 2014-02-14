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

            $scope.loading = true;

            Leagues.get({
                leagueId: $routeParams.leagueId
            },
            function(league) {
                $scope.league = league;
                $scope.leagues = [league];

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

                    var getDefaultYLim = function(center, direction, agents) {
                        var off = 0;
                        if (direction === 'down') {
                            // offset of highest-valued agent from center
                            var lastagent = _.last(agents) || {
                                status: {total_value: league.startCash - 1000}
                            };
                            off = center - lastagent.status.total_value;
                        }
                        if (direction === 'up') {
                            // offset of lowest-valued agent from center
                            var firstagent = _.first(agents) || {
                                status: {total_value: league.startCash + 1000}
                            };
                            off = firstagent.status.total_value - center;
                        }

                        off = Math.max(10, off);
                        var order = Math.ceil(Math.log(off) / Math.log(10));
                        return order;
                    };

                    $scope.agents = agents;

                    $scope.leaguechart_lims = {
                        center: league.startCash,
                        up_value: 1,
                        up_order: getDefaultYLim(league.startCash, 'up',
                                                 agents),
                        down_value: 1,
                        down_order: getDefaultYLim(league.startCash, 'down',
                                                   agents)
                    };
                    $scope.setLeagueChartOptions();
                    $scope.loading = false;
                });
            });
        };

        /**
         * @param limit {'lower', 'upper'}
         * @param size {'order', 'value'}
         * @param direction {-1, 1}
         */
        $scope.leagueChartYMove = function(the_limit, size, direction) {
            if (the_limit === 'lower') {
                if (size === 'order') {
                    var new_down_order = $scope.leaguechart_lims.down_order +
                        direction;
                    new_down_order = Math.max(-1, new_down_order);
                    new_down_order = Math.min(
                        Math.ceil(Math.log(
                            $scope.leaguechart_lims.center) / Math.log(10)),
                        new_down_order);
                    $scope.leaguechart_lims.down_order = new_down_order;

                }
                if (size === 'value') {
                    var new_down_value = $scope.leaguechart_lims.down_value +
                        direction;
                    new_down_value = Math.max(1, new_down_value);
                    new_down_value = Math.min(9, new_down_value);
                    $scope.leaguechart_lims.down_value = new_down_value;
                }
            }
            if (the_limit === 'upper') {
                if (size === 'order') {
                    var new_up_order = $scope.leaguechart_lims.up_order +
                        direction;
                    new_up_order = Math.max(-1, new_up_order);
                    new_up_order = Math.min(
                        Math.ceil(Math.log(
                            $scope.leaguechart_lims.center) / Math.log(10)),
                        new_up_order);
                    $scope.leaguechart_lims.up_order = new_up_order;

                }
                if (size === 'value') {
                    var new_up_value = $scope.leaguechart_lims.up_value +
                        direction;
                    new_up_value = Math.max(1, new_up_value);
                    new_up_value = Math.min(9, new_up_value);
                    $scope.leaguechart_lims.up_value = new_up_value;
                }
            }
        };

        $scope.leagueChartLimit = function(center, direction, order, value) {
            return center + direction*(value * Math.pow(10, order));
        };

        $scope.setLeagueChartOptions = function() {
            if ($scope.league === undefined ||
                $scope.leaguechart_lims === undefined) {
                return;
            }

            var league = $scope.league;
            var limits = $scope.leaguechart_lims;

            $scope.leaguechart_lims.lower =
                $scope.leagueChartLimit(limits.center, -1,
                                        limits.down_order,
                                        limits.down_value);
            $scope.leaguechart_lims.upper =
                $scope.leagueChartLimit(limits.center, 1,
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
                    panRange: [$scope.leaguechart_lims.lower,
                               $scope.leaguechart_lims.upper],
                    min: $scope.leaguechart_lims.lower,
                    max: $scope.leaguechart_lims.upper
                },
                zoom: {
                    interactive: true
                },
                pan: {
                    interactive: true
                },
                legend: {
                    show: false,
                    //container: '#chart-legend',
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
