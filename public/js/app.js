window.app = angular.module('tdf', ['ngCookies', 'ngResource', 'ui.bootstrap', 
                            'ui.route', 'tdf.system', 'tdf.articles',
                            'tdf.users', 'tdf.leagues']);

angular.module('tdf.system', []);
angular.module('tdf.articles', []);
angular.module('tdf.users', []);
angular.module('tdf.leagues', []);
