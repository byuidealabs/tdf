angular.module('tdf').controller('SlideshowController',
    ['$scope', '$timeout',
    function ($scope, $timeout) {
        var slidesInSlideshow = 2;
        var slidesTimeIntervalInMs = 5000; 
  
        $scope.slideshow = 1;
        var slideTimer =
        $timeout(function interval() {
        $scope.slideshow = ($scope.slideshow % slidesInSlideshow) + 1;
        slideTimer = $timeout(interval, slidesTimeIntervalInMs);
    }, slidesTimeIntervalInMs);
}
]);
