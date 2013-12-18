window.app = angular.module('tdf', ['ngCookies', 'ngResource', 'ngRoute',
                            'ui.bootstrap', 'd3', 'tdf.utilities', 'timer',
                            'tdf.system', 'tdf.users', 'tdf.leagues',
                            'tdf.agents', 'tdf.histories']);

angular.module('tdf.system', []);
angular.module('tdf.users', []);
angular.module('tdf.leagues', []);
angular.module('tdf.agents', []);
angular.module('tdf.histories', []);

angular.module('tdf.utilities', []);

angular.module('underscore', []);
angular.module('d3', []);
