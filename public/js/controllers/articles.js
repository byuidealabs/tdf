angular.module('tdf.articles').controller('ArticlesController',
    ['$scope', '$routeParams', '$location', 'Global', 'Utilities', 'Articles',
    function ($scope, $routeParams, $location, Global, Utilities, Articles) {
        $scope.global = Global;

        $scope.create = function() {
            var article = new Articles({
                title: this.title,
                content: this.content
            });
            article.$save(function(response) {
                $location.path('articles/' + response._id);
            });

            this.title = '';
            this.content = '';
        };

        $scope.remove = function(article) {
            article.$remove();
            Utilities.spliceByObject($scope.articles, article);
        };

        $scope.update = function() {
            var article = $scope.article;
            if (!article.updated) {
                article.updated = [];
            }
            article.updated.push(new Date().getTime());

            article.$update(function() {
                $location.path('articles/' + article._id);
            });
        };

        $scope.find = function(query) {
            Articles.query(query, function(articles) {
                $scope.articles = articles;
            });
        };

        $scope.findOne = function() {
            Articles.get({
                articleId: $routeParams.articleId
            }, function(article) {
                $scope.article = article;
            });
        };
    }]);
