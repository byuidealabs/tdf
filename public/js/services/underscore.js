// underscore.js injection service.
angular.module('underscore').factory('_',
    [
    function() {
        return window._;
    }]);
