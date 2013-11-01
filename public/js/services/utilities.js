angular.module('tdf.utilities').factory('Utilities',
[
    function() {
        return {
            /**
             * Removes all objects from list where object[propertyname] equals
             * property.
             *
             * Note that the operation is performed in-place, though the
             * result is also returned.
             */
            spliceByProperty: function(list, propertyname, property) {
                for (var i in list) {
                    if (list[i][propertyname] === property) {
                        list.splice(i, 1);
                    }
                }
                return list;
            },
            /**
             * Removes all objects from list where the object is equal to obj.
             *
             * Note that the operation is performed in-place, though the
             * result is also returned.
             */
            spliceByObject: function(list, obj) {
                for (var i in list) {
                    if (list[i] === obj) {
                        list.splice(i, 1);
                    }
                }
                return list;
            }
        };
    }
]);
