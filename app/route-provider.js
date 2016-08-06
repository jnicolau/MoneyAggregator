/**
 * Created by joao on 12/07/2016.
 */
(function () {
    "use strict";

    // Route Provider
    app.config(['$routeProvider', '$sceDelegateProvider', function ($routeProvider, $sceDelegateProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/dashboard.html',
                controller: 'dashboardController',
                controllerAs: 'dashboard'
            })
            .when('/settings', {
                templateUrl: 'app/settings.html'
                //controller: 'settingsController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }]);

    // App Controller
    app.controller("mainController", ["$scope", function ($scope) {
        //var me = this;
    }]);
})();
