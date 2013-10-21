// Agents service used for agents REST endpoint
angular.module('tdf.agents').factory('Agents',
    ['$resource',
    function($resource) {
        return $resource('agents/:agentId',
            {
                agentId: '@_id'
            },
            {
                update: {method: 'PUT'}
            });
    }]);
