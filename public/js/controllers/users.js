angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', '$modal', 'Global', 'Utilities',
     'Users', 'Agents', 'Leagues', '_',
    function ($scope, $routeParams, $location, $modal, Global, Utilities,
              Users, Agents, Leagues, _) {
        $scope.global = Global;
        $scope.saveerror = '';

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
            $scope.savesuccess = '';
            $scope.saveerror = '';
            user.$update(function() {
                // Success
                Global.set_user(user);
                $scope.savesuccess = 'Save Successful';
            },
            function(msg) {
                // Failure
                $scope.saveerror = msg.data.flash;
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
    }]);
