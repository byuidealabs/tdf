// Filter to convert an integer to a range (for use in ng-repeat)
angular.module('tdf').filter('Range',
    ['_',
    function(_) {
        return function(size) {
            return _.range(size);
        };
    }]);
