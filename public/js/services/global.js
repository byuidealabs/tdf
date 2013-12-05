angular.module('tdf.system').factory('Global',
    [function() {
        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: !! window.user,
            set_user: function(user) {
                window.user = user;
                _this._data.user = user;
            }
        };

        return _this._data;
    }]);
