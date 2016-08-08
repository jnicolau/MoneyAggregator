//app
var app = angular.module("app", ["ngRoute", "frapontillo.bootstrap-switch", 'papa-promise']);

app.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function (val) {
                return '' + val;
            });
        }
    };
});