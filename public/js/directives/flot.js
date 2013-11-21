angular.module('tdf').directive('chart',
    ['$',
    function($) {
        return{
            restrict: 'EA',
            link: function(scope, elem, attrs){

                var chart = null;

                var data = attrs.data;
                var opts = attrs.options;

                scope.$watch(data, function(points){
                    if (points === undefined) {
                        return;
                    }
                    if (!chart) {
                        var options = scope[opts] || {};
                        chart = $.plot(elem, points , options);
                        elem.show();
                    }
                    else {
                        chart.setData(points);
                        chart.setupGrid();
                        chart.draw();
                    }
                });

                scope.$watch(opts, function(options) {
                    if (options === undefined) {
                        return;
                    }
                    var points = scope[data] || [];
                    chart = $.plot(elem, points, options);
                    elem.show();
                });
            }
        };
    }]);
