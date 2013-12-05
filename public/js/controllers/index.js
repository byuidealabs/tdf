angular.module('tdf.system').controller('IndexController',
    ['$scope', 'Global', 'Users',
    function ($scope, Global, Users) {
        $scope.global = Global;

        $scope.loginerror = '';

        $scope.create_user = function() {
            console.log('reached');
            console.log($scope.newuser);
            var user = new Users($scope.newuser);
            user.$save(function(/*response*/) {
                console.log('saved');
            });

            console.log(user);
        };

        $scope.login = function() {
            $scope.loginerror = '';
            Users.login($scope.loginuser, function() {
                // Successful Login
                // Reload everything so that angular can reconfigure itself
                window.location.reload();
            }, function(msg) {
                // Failed Login
                $scope.loginerror = msg.data.flash;
            });
        };
    }]);
