angular.module('tdf').controller('testBarsController',
    ['$scope',
    function($scope) {
        $scope.greeting = 'Resize the page to view the greeting';
        $scope.d3data = [
            {name: 'Greg', score: 98},
            {name: 'Ari', score: 96},
            {name: 'Q', score: 75},
            {name: 'Loser', score: 48}
        ];
    }]);
