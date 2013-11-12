angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', '$modal', 'Global', 'Utilities',
     'Users', 'Agents', 'Leagues', '_',
    function ($scope, $routeParams, $location, $modal, Global, Utilities,
              Users, Agents, Leagues, _) {
        $scope.global = Global;

        $scope.find = function(query) {
            Users.query(query, function(users) {
                $scope.users = users;
            });
        };

        $scope.findOne = function() {
            Users.get({
                userId: $routeParams.userId
            }, function(user) {
                $scope.user = user;
                $scope.isme = ($scope.user.id === $scope.global.user._id);

                $scope.findUserLeaguesAndAgents(user);
            });
        };

        $scope.getProfile = function() {
            Users.getProfile({}, function(user) {
                $scope.user = user;

                $scope.findUserLeaguesAndAgents(user);
            });
        };

        $scope.findUserLeaguesAndAgents = function(user) {
            Agents.query(function(agents) {
                // TODO make more efficient query so backend only has to
                // return this user's agents
                $scope.agents = _.filter(agents, function(agent) {
                    return agent.user._id === user.id;
                });
            });
            Leagues.query(function(leagues) {
                $scope.leagues = leagues;
            });
        };

        $scope.updateProfile = function() {
            var user = $scope.user;
            user.$update(function() {
                $location.path('users/' + user._id);
            });
        };

        $scope.removeAgent = function(agent) {
            var modalInstance = $modal.open({
                templateUrl: 'views/confirmModal.html',
                controller: function($scope, $modalInstance) {
                    $scope.heading = 'Confirm Agent Deletion';
                    $scope.message = 'Are you sure you wish to delete this ' +
                                     'agent and all of its data? (this ' +
                                     'action cannot be undone)';

                    $scope.confirm = function() {
                        $modalInstance.close('confirmed');
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });

            modalInstance.result.then(function () {
                Agents.remove({
                    agentId: agent._id
                }, function() {
                    Utilities.spliceByProperty($scope.user.agents, '_id',
                                               agent._id);
                });
            });
        };
    }]);
