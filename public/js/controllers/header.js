angular.module('tdf.system').controller('HeaderController',
    ['$scope', 'Global',
    function ($scope, Global) {
        $scope.global = Global;

        $scope.menu = [
            {
                'title': 'My Agents',
                'link': 'users/' + $scope.global.user._id
            },
            {
                'title': 'Leagues',
                'link': 'leagues/'
            },
            {
                'title': 'All Users',
                'link': 'users/'
            }
        ];

    }]);
