angular.module('tdf').controller('testLinesController',
    ['$scope',
    function($scope) {
        $scope.greeting = 'Resize the page to view the greeting';
        $scope.d3data = [
            {name: 'Greg', score: [98, 93, 87, 99]},
            {name: 'Ari', score: [96, 91, 92, 94]},
            {name: 'Q', score: [75, 67, 83, 71]},
            {name: 'Loser', score: [48, 44, 58, 61]}
        ];
    }]);
