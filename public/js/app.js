window.app = angular.module('tdf', ['ngCookies', 'ngResource', 'ngRoute',
                            'ui.bootstrap', 'underscore', 'd3',
                            'tdf.utilities',
                            'tdf.system', 'tdf.articles', 'tdf.users',
                            'tdf.leagues', 'tdf.agents']);

angular.module('tdf.system', []);
angular.module('tdf.articles', []);
angular.module('tdf.users', []);
angular.module('tdf.leagues', []);
angular.module('tdf.agents', []);

angular.module('tdf.utilities', []);

angular.module('underscore', []);
angular.module('d3', []);
