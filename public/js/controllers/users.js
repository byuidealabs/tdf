angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', 'Global', 'Users', 'Agents',
    function ($scope, $routeParams, $location, Global, Users, Agents) {
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
            });
        };

        $scope.getProfile = function() {
            Users.getProfile({}, function(user) {
                $scope.user = user;
            });
        };

        $scope.updateProfile = function() {
            var user = $scope.user;
            user.$update(function() {
                $location.path('users/' + user._id);
            });
        };

        $scope.removeAgent = function(agent) {
            var del = confirm('Are you sure you wish to delete this agent ' +
                              'and all of its data? (this action cannot ' +
                              'be undone)');
            if (del) {
                Agents.remove({
                    agentId: agent._id
                }, function() {
                    for (var i in $scope.user.agents) {
                        if ($scope.user.agents[i]._id === agent._id) {
                            $scope.user.agents.splice(i, 1);
                        }
                    }
                });
            }
        };
    }]);
