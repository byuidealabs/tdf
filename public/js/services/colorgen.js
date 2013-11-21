// Service to generate colors in a set sequence for consistant graphing
angular.module('tdf').factory('Colors',
    [function() {
        var colorlist = ['#edc240',
                            '#afd8f8',
                            '#cb4b4b',
                            '#4da74d',
                            '#9440ed'];
        var size = colorlist.length;

        return {
            atindex: function(index) {
                return colorlist[index % size];
            }
        };
    }]);
