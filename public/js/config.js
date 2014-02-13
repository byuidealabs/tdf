//Setting up route
window.app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.

        // Users

        when('/users', {
            templateUrl: 'views/users/list.html'
        }).
        when('/users/profile', {
            templateUrl: 'views/users/profile.html'
        }).
        when('/users/:userId', {
            templateUrl: 'views/users/view.html'
        }).

        // Leagues

        when('/leagues', {
            templateUrl: 'views/leagues/list.html'
        }).
        when('/leagues/create', {
            templateUrl: 'views/leagues/edit.html'
        }).
        when('/leagues/:leagueId/edit', {
            templateUrl: 'views/leagues/edit.html'
        }).
        when('/leagues/:leagueId', {
            templateUrl: 'views/leagues/view.html'
        }).

        // Agents

        when('/agents', {
            templateUrl: 'views/agents/list.html'
        }).
        when('/agents/create', {
            templateUrl: 'views/agents/create.html'
        }).
        when('/agents/create/:leagueId', {
            templateUrl: 'views/agents/create.html'
        }).
        when('/agents/:agentId/edit', {
            templateUrl: 'views/agents/edit.html'
        }).
        when('/agents/:agentId/trade', {
            templateUrl: 'views/agents/trade.html'
        }).
        when('/agents/:agentId', {
            templateUrl: 'views/agents/view.html'
        }).

        // Histories

        when('/histories', {
            // Histories for all stocks tracked by all leagues in the system
            templateUrl: 'views/histories/list.html'
        }).
        when('/leagues/:leagueId/histories/', {
            // Histories for only the stocks tracked by the given league
            templateUrl: 'views/histories/list.html'
        }).
        when('/histories/:ticker', {
            templateUrl: 'views/histories/view.html'
        }).
        when('leagues/:leagueId/histories/:ticker', {
            templateUrl: 'views/histories/view.html'
        }).

        // Testing

        when('/testmetrics', {
            templateUrl: 'views/testmetrics.html'
        }).
        when('/testbars', {
            templateUrl: 'views/testbars.html'
        }).

        // Index & default

        when('/', {
            templateUrl: 'views/index.html'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);


window.app.run(['Global', '$location', '$rootScope',
    function(Global, $location, $rootScope){
        $rootScope.$on('$routeChangeStart', function(event,
                                                     next /*, current*/){
            var isLoggedin = !!Global.user;
            if (isLoggedin)
            {
                if (next.templateUrl === 'views/index.html')
                {
                    $location.path('/leagues');
                }
                if (!Global.user.isAdmin)
                {
                    if (next.templateUrl === 'views/users/list.html')
                    {
                        $location.path('/');
                    }
                }
            }

            if (!isLoggedin)
            {
                if (next.templateUrl === 'views/users/list.html')
                {
                    $location.path('/');
                }
            }

        });
    }
]);

//Setting HTML5 Location Mode
window.app.config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix('!');
    }
]);
