// Histories service used for histories REST endpoint
angular.module('tdf.histories').factory('Histories',
    ['$resource', '_',
    function($resource, _) {
        return $resource('history/:ticker', {
            ticker: '@_ticker'
        }, {
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: function(data) {
                    var res = JSON.parse(data);
                    res = _.map(res, function(val) {
                        return {'symbol': val};
                    });
                    return res;
                }
            }
        });
    }]);
