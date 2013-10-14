angular.module('tdf.system').controller('HeaderController', 
    ['$scope', 'Global', 
    function ($scope, Global) {
        $scope.global = Global;

        $scope.menu = [
            {
                'title': 'Leagues',
                'link': 'leagues/'
            },
            {
                'title': 'Users',
                'link': 'users/'}];
        
    }]);
