angular.module('tdf.system').controller('HeaderController',
    ['$scope', 'Global',
    function ($scope, Global) {
        $scope.global = Global;

        $scope.setMenu = function() {
            if (!$scope.global.user) {
                $scope.menu = $scope.getPublicMenu();
            }
            else if ($scope.global.user.isAdmin) {
                $scope.menu = $scope.getAdminMenu();
            }
            else {
                $scope.menu = $scope.getPrivateMenu();
            }
        };

        $scope.getPublicMenu = function() {
            return [
                {
                    'title': 'Leagues',
                    'link': 'leagues/'
                }

            ];
        };

        $scope.getAdminMenu = function() {
            var public_menu = $scope.getPublicMenu();
            var private_menu = $scope.getPrivateMenu();
            var admin_menu = [
                {
                    'title': 'All Users',
                    'link': 'users'
                }
            ];
            return private_menu.concat(admin_menu); 
        };

        $scope.getPrivateMenu = function() {
            var public_menu = $scope.getPublicMenu();
            var private_menu = [
                {
                    'title': 'My Agents',
                    'link': 'users/' + $scope.global.user._id
                }
            ];
            return public_menu.concat(private_menu);
        };
    }]);
