angular.module('tdf').directive('leagueTime',
    ['moment',
    function(moment) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'views/directives/league/leaguetime.html',
            scope: {
                ngModel: '='
            },
            controller: function($scope) {

                $scope.$watch('ngModel', function(ngModel) {
                    if (!ngModel || $scope.splitTime) {
                        // Only call if an ng-model exists and splitTime
                        // does not
                        return;
                    }
                    var momentTime = moment.parseZone(ngModel.toString());
                    $scope.splitTime = {
                        Day: momentTime.format('YYYY-MM-DD'),
                        Time: momentTime.format('HH:mm')
                    };
                });

                $scope.$watch('splitTime', function(splitTime) {
                    if (!splitTime || !splitTime.Day || !splitTime.Time) {
                        return;
                    }
                    $scope.ngModel = new Date(splitTime.Day + ' ' +
                                              splitTime.Time + ' GMT');
                }, true);
            }
        };
    }]);
