angular.module('tdf').directive('agentList',
    [function() {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentlist.html',
            scope: {
                leagues: '=',
                agents: '='
            }
        };
    }]);
