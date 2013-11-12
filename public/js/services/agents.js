// Agents service used for agents REST endpoint
angular.module('tdf.agents').factory('Agents',
    ['$resource',
    function($resource) {
        return $resource('agents/:agentId', {
            agentId: '@_id'
        },
        {
            update: {method: 'PUT'},
        });
    }]).
factory('Trades',
    ['$resource',
    function($resource) {
        return $resource('agents/trade/:agentId', {
            agentId: '@agentId'
        },
        {
            update: {method: 'PUT'}
        });
    }]).
factory('ApiKeys',
    ['$resource',
    function($resource) {
        return $resource('agents/apikey/:agentId', {
            agentId: '@agentId'
        }, {
            update: {method: 'PUT'}
        });
    }]);
