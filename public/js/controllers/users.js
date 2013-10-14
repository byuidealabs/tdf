angular.module('tdf.users').controller('UsersController',
    ['$scope', '$routeParams', '$location', 'Global', 'Users', 
    function ($scope, $routeParams, $location, Global, Users) {
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
                $scope.isme = ($scope.user.id == $scope.global.user._id);
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
    }]);
