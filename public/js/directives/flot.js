angular.module('tdf').directive('chart',
    ['_',
    function(_) {
        return{
            restrict: 'EA',
            link: function(scope, elem, attrs){

                var chart = null;

                var data = attrs.data;
                var opts = attrs.options;

                scope.$watch(data, function(v){
                    if (v === undefined) {
                        return;
                    }
                    if (!chart) {
                        var options = scope[opts] || {};
                        chart = $.plot(elem, v , options);
                        elem.show();
                    }
                    else {
                        chart.setData(v);
                        chart.setupGrid();
                        chart.draw();
                    }
                });

                scope.$watch(opts, function(v) {
                    if (v === undefined) {
                        return;
                    }
                    var data = scope[data] || [];
                    chart = $.plot(elem, data, v);
                });
            }
        };
    }]);
