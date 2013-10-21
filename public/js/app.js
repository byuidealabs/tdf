window.app = angular.module('tdf', ['ngCookies', 'ngResource', 'ui.bootstrap',
                            'ui.route', 'underscore',
                            'tdf.system', 'tdf.articles', 'tdf.users',
                            'tdf.leagues', 'tdf.agents']);

angular.module('tdf.system', []);
angular.module('tdf.articles', []);
angular.module('tdf.users', []);
angular.module('tdf.leagues', []);
angular.module('tdf.agents', []);

angular.module('underscore', []);
