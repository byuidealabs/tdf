angular.module('tdf.leagues').controller('LeaguesController',
    ['$scope', '$routeParams', '$location', 'Global', 'Leagues',
    function($scope, $routeParams, $location, Global, Leagues) {
        $scope.global = Global;

        $scope.create = function() {
            var league = new Leagues({
                name: this.name
            });

            league.$save(function(response) {
                $location.path('leagues/' + response._id);
            });
    
            this.name = '';
        };

        $scope.remove = function(league) {
            // TODO decide how to handle agents in deleted leagues
            league.$remove();

            if ($scope.leagues) {
                // Needed if called from list.html
                for (var i in $scope.leagues) {
                    if ($scope.leagues[i] == league) {
                        $scope.leagues.splice(i, 1);
                    }
                }
            }

            $location.path('leagues/');
        };

        $scope.update = function() {
            var league = $scope.league;
            if (!league.updated) {
                league.updated = [];
            }
            league.updated.push(new Date().getTime());

            league.$update(function() {
                $location.path('leagues/' + league._id);
            });
        };

        $scope.find = function(query) {
            Leagues.query(query, function(leagues) {
                $scope.leagues = leagues;
            });
        };

        $scope.findOne = function() {
            Leagues.get({
                leagueId: $routeParams.leagueId
            },
            function(league) {
                $scope.league = league;
                $scope.league.test = [1, 2, 3];
            });
        };

    }]);
