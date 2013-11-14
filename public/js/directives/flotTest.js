angular.module('tdf').directive('chart', function(){
    return{
        restrict: 'E',
        link: function(scope, elem, attrs){
            
            var chart = null,
                opts  = { legend:{position:"nw"}};
            
            var data = scope[attrs.ngModel];            
            
            scope.$watch('data', function(v){
                if(!chart){
                    chart = $.plot(elem, v , opts);
                    elem.show();
                }else{
                    chart.setData(v);
                    chart.setupGrid();
                    chart.draw();
                }
                $("div.flot-x-axis").each(function(i,ele) {
                    ele = $(ele);
                    //fix poor y-axis alignment
                    ele.css("left", ele.position().left - 10);
                    ele.css("top", ele.position().top - 3);
                });

                $("div.flot-y-axis").each(function(i,ele) {
                    ele = $(ele);
                    //fix poor y-axis alignment
                    ele.css("left", ele.position().left - 15);
                    ele.css("top", ele.position().top - 9);
                });
            });
        }
    };
});
