angular.module('tdf.agents').controller('AgentsController',
    ['$scope', '$routeParams', '$location', 'Global', 'Agents', 'Leagues',
    function ($scope, $routeParams, $location, Global, Agents, Leagues) {
        $scope.global = Global;

        $scope.getDefault = function() {
            $scope.agent = {
                name: ''
            };

            Leagues.query(function(leagues) {
                $scope.leagues = leagues;
            });
        };

        $scope.create = function() {
            var agent = new Agents($scope.agent);
            agent.$save(function(/*response*/) {
                $location.path('agents/' + agent._id);
            });
        };

        $scope.remove = function(agent) {
            agent.$remove();

            for (var i in $scope.agents) {
                if ($scope.agents[i] === agent) {
                    $scope.agents.splice(i, 1);
                }
            }

            $location.path('agents/');
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
        };

        $scope.findOne = function() {
            Agents.get({
                agentId: $routeParams.agentId
            }, function(agent) {
                $scope.agent = agent;
            });
        };
    }]);
