angular.module('tdf').directive('chart',
    ['_',
    function(_) {
        return{
            restrict: 'EA',
            link: function(scope, elem, attrs){

                var chart = null;

                var data = attrs.data;
                var opts = scope[attrs.options] || {};

                scope.$watch(data, function(v){
                    if (v === undefined) {
                        return;
                    }
                    if(!chart) {
                        chart = $.plot(elem, v , opts);
                        elem.show();
                    }
                    else {
                        chart.setData(v);
                        chart.setupGrid();
                        chart.draw();
                    }
                });
            }
        };
    }]);
