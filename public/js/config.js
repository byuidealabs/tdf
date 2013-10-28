//Setting up route
window.app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.

        // Articles

        when('/articles', {
            templateUrl: 'views/articles/list.html'
        }).
        when('/articles/create', {
            templateUrl: 'views/articles/create.html'
        }).
        when('/articles/:articleId/edit', {
            templateUrl: 'views/articles/edit.html'
        }).
        when('/articles/:articleId', {
            templateUrl: 'views/articles/view.html'
        }).

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
            templateUrl: 'views/leagues/create.html'
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
        when('/agents/:agentId/edit', {
            templateUrl: 'views/agents/edit.html'
        }).
        when('/agents/:agentId/trade', {
            templateUrl: 'views/agents/trade.html'
        }).
        when('/agents/:agentId', {
            templateUrl: 'views/agents/view.html'
        }).

        // Testing

        when('/testmetrics', {
            templateUrl: 'views/testmetrics.html'
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

//Setting HTML5 Location Mode
window.app.config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix('!');
    }
]);
