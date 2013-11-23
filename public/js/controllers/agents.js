angular.module('tdf.agents').controller('AgentsController',
    ['$scope', '$routeParams', '$location', '$modal', 'Global', 'Utilities',
     'Agents', 'Leagues', 'Trades', 'ApiKeys', '_',
    function ($scope, $routeParams, $location, $modal, Global, Utilities,
              Agents, Leagues, Trades, ApiKeys, _) {
        $scope.global = Global;

        $scope.getDefault = function() {
            Leagues.query(function(leagues) {
                var league = $routeParams.leagueId;
                if (league === undefined) {
                    league = _.first(leagues)._id;
                }

                $scope.leagues = leagues;
                $scope.agent = {
                    name: '',
                    league: league
                };
            });
        };

        $scope.create = function() {
            var agent = new Agents($scope.agent);
            agent.$save(function(/*response*/) {
                $location.path('agents/' + agent._id);
                //$location.path('users/profile');
            });
        };

        $scope.remove = function(agent) {
            /*agent.$remove();
            Utilities.spliceByObject($scope.agents, agent);
            $location.path('agents/');*/
            var modalInstance = $modal.open({
                templateUrl: 'views/confirmModal.html',
                controller: function($scope, $modalInstance) {
                    $scope.heading = 'Confirm Agent Deletion';
                    $scope.message = 'Are you sure that you want to delete ' +
                                     'this agent? ' +
                                     '(this action cannot be undone)';

                    $scope.confirm = function() {
                        $modalInstance.close('confirmed');
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });

            modalInstance.result.then(function() {
                agent.$remove();
                Utilities.spliceByObject($scope.agents, agent);
                $location.path('users/' + $scope.global.user._id);
            });

        };

        $scope.update = function() {
            var agent = $scope.agent;

            agent.$update(function() {
                $location.path('agents/' + agent._id);
            });
        };

        $scope.find = function(query) {
            Agents.query(query, function(agents) {
                $scope.agents = agents;
            });

            Leagues.query(function(leagues) {
                $scope.leagues = leagues;
            });
        };

        $scope.findOne = function() {

            $scope.apikeytype = 'password';
            $scope.apikeybtn = 'Show';

            Agents.get({
                agentId: $routeParams.agentId
            }, function(agent) {
                $scope.agent = agent;
            });
        };

        $scope.toggleapikey = function() {
            if ($scope.apikeytype === 'password') {
                $scope.apikeytype = 'text';
                $scope.apikeybtn = 'Hide';
            }
            else {
                $scope.apikeytype = 'password';
                $scope.apikeybtn = 'Show';
            }
        };

        $scope.getDefaultTrade = function() {
            $scope.trade = [];
        };

        $scope.addTrade = function() {
            $scope.trade.push({s: '', q: 0});
        };

        $scope.removeTrade = function(i) {
            $scope.trade.splice(i, 1);
        };

        $scope.executeTrade = function() {
            var finaltrades = {};
            _.each($scope.trade, function(trade) {
                var curr_quantity = finaltrades[trade.s] || 0;
                finaltrades[trade.s] = curr_quantity + trade.q;
            });
            Trades.update({
                agentId: $routeParams.agentId,
                trade: finaltrades
            }, function(res) {
                if (_.contains(_.keys(res), 'error')) {
                    $scope.message = {
                        type: 'danger',
                        heading: 'Trade Failed',
                        body: res.error
                    };
                }
                else {
                    $scope.agent = res;
                    $scope.getDefaultTrade();
                    $scope.message = {
                        type: 'success',
                        heading: 'Trade Succeeded',
                        body: 'All trades were successfully executed.'
                    };
                }
            });
        };

        $scope.resetTrades = function() {
            var modalInstance = $modal.open({
                templateUrl: 'views/confirmModal.html',
                controller: function($scope, $modalInstance) {
                    $scope.heading = 'Confirm Trade Reset';
                    $scope.message = 'Are you sure that you want to reset ' +
                                     'the trades made by this agent? ' +
                                     '(this action cannot be undone)';

                    $scope.confirm = function() {
                        $modalInstance.close('confirmed');
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });

            modalInstance.result.then(function() {
                Trades.remove({
                    agentId: $routeParams.agentId
                }, function(agent) {
                    $scope.agent = agent;
                    $scope.message = false;
                });
            });
        };

        $scope.resetapikey = function() {
            ApiKeys.remove({
                agentId: $routeParams.agentId
            }, function(agent) {
                $scope.agent.apikey = agent.apikey;
            });
        };

        $scope.$on('timer-stopped', function() {
            $scope.findOne();
            $scope.$broadcast('timer-start');
        });
    }]);
