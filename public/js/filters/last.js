// Filter to select the last element of a list
angular.module('tdf').filter('last',
    ['_',
    function(_) {
        return function(input) {
            return _.last(input);
        };
    }]);
