angular.module('tdf').controller('TestFlotController',
    function ($scope) {
    var data1 = [[0, 1], [1, 5], [2, 2]],
        data2 = [[0, 4], [1, 2], [2, 4]],
        curr  = 1;
    
    //$scope.data = data1;

    $scope.data = [{ data:data1, label:"data1", lines:{show:true}},{ data:data2, label:"data2", lines:{show:true}, points:{show:true}}];
    
    $scope.change = function(){ 
        if(curr === 1){ 
            $scope.data = data2;
            curr = 2;
        }else{
            $scope.data = data1;
            curr = 1;
        }
    };
});
