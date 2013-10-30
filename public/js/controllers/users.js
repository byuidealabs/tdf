angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', 'Global', 'Utilities', 'Users',
     'Agents',
    function ($scope, $routeParams, $location, Global, Utilities, Users,
              Agents) {
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
                    Utilities.spliceByProperty($scope.user.agents, '_id',
                                               agent._id);
                });
            }
        };
    }]);
