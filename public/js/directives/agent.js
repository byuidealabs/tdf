angular.module('tdf').directive('agentList',
    [function() {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentlist.html',
            scope: false
        };
    }])
.directive('agentStatus',
    [function() {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/agent/agentstatus.html',
            scope: {
                status: '='
            }
        };
    }]);
