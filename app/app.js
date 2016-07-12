//app
var app = angular.module("app", ["ngRoute"]);

(function () {
    "use strict";

    // Route Provider
    app.config(['$routeProvider', '$sceDelegateProvider', function ($routeProvider, $sceDelegateProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main.html'
                //controller: 'mainController'
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

//function chunk(arr, chunkSize) {
//    var newArr = [];
//    for (var i = 0; i < arr.length; i += chunkSize) {
//        newArr.push(arr.slice(i, i + chunkSize));
//    }
//    return newArr;
//}

//$sceDelegateProvider.resourceUrlWhitelist([
//    // Allow same origin resource loads.
//    'self',
//    // Allow loading from our assets domain.  Notice the difference between * and **.
//    'https://my.sseairtricity.com/oss_web/login.htm',
//    'http://files.streamroot.io/release/latest/wrappers/jwplayer/6.8/jwplayer.srflash.swf'
//]);
