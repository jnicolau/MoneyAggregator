/**
 * Created by joao on 07/02/2016.
 */
(function () {
    "use strict";

    // Payees Service
    app.service('payees', [
        "airtricity", "virginMedia", "aib",
        function (airtricity, virginMedia, aib) {

            return Array.prototype.slice.call(arguments);
        }]);

    // Payees Controller
    app.controller("payeesController", ["$scope", "payees", function ($scope, payees) {
        var me = this;

        this.payees = payees;

        this.payees.forEach(function (payee) {
            payee.load().done(function () {
                $scope.$apply();
            });
        });

        this.openUrl = function (url) {
            window.open(url, '_blank');
        };

        this.getTemplateUrl = function (payee) {
            return "app/services/" + payee.template;
        };
    }]);


})();