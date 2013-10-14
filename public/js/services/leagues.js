// Leagues service used for the leagues REST endpoint
angular.module('tdf.leagues').factory('Leagues',
    ['$resource',
    function($resource) {
        return $resource('leagues/:leagueId', 
            {
                leagueId: '@_id'
            },
            {
                update: { method: 'PUT' }
            });
    }]);
