angular.module('tdf.system').controller('IndexController',
    ['$scope', 'Global', 'Users',
    function ($scope, Global, Users) {
        $scope.global = Global;

        $scope.loginerror = '';
        $scope.registererror = '';

        $scope.register = function() {
            $scope.registererror = '';

            if ($scope.newuser.password !== $scope.newuser.checkpassword) {
                $scope.registererror = 'Passwords are not the same';
            }
            else {
                var user = new Users($scope.newuser);
                user.$save(function(/*response*/) {
                    // Successful Registration
                    window.location.reload();
                }, function(msg) {
                    // Failed Registration
                    $scope.registererror = msg.data.flash;
                });
            }
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
