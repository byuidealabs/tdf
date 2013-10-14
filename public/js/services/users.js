// Users service used for users REST endpoint
angular.module('tdf.users').factory("Users", 
    ['$resource', 
    function($resource) {
        return $resource('users/:userId', {
            userId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            getProfile: {
                method: 'GET',
                params: {
                    'userId': 'profile'
                }
            }
        });
    }]);
