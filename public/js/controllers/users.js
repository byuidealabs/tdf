angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', '$modal', 'Global', 'Utilities',
     'Users', 'Agents', 'Leagues',
    function ($scope, $routeParams, $location, $modal, Global, Utilities,
              Users, Agents, Leagues) {
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
                $scope.agents = user.agents;
                $scope.isme = ($scope.user.id === $scope.global.user._id);
                Leagues.query(function(leagues) {
                    $scope.leagues = leagues;
                });
            });
        };

        $scope.getProfile = function() {
            Users.getProfile({}, function(user) {
                $scope.user = user;
                $scope.agents = user.agents;
                Leagues.query(function(leagues) {
                    $scope.leagues = leagues;
                });
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
