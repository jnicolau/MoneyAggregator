/**
 * Created by joao on 14/02/2016.
 */
(function () {
    "use strict";

    // Payees Service
    app.service('airtricity', [function () {
        var reframerOptions = {
            authentication: Reframer.authentications.chromeExtension,
            isAuthenticated: function ($html) {
                return $html.find("#loginForm").length === 0;
            },
            authenticationUrl: "https://my.sseairtricity.com/oss_web/login.htm"
        };

        var airtricity = {
            name: "Airtricity",
            logoUrl: "https://my.sseairtricity.com/oss_web/img/airtricity-logo.png",
            template: "airtricity.html",
            loaded: false,
            load: function () {
                return "https://my.sseairtricity.com/oss_web/account-history.htm"
                    .fetch(reframerOptions)
                    .then(function ($html) {
                        return Reframer.promise($html.find("#acc-history tr:gt(0)")
                            .insertElementIf(0, "<tr/>", function () {
                                return $(this).first().find("td:eq(2)").text().trim() !== "";
                            })
                            .slice(0, 4)
                            .mapPairs(function ($tr1, $tr2) {
                                return {
                                    billAmount: parseFloat($tr2.find("td:eq(2)").text().trim().slice(1)),
                                    paymentDate: Date.parse($tr1.find("td")[0].innerText.trim()),
                                    billDate: Date.parse($tr2.find("td")[0].innerText.trim()),
                                    billUrl: ("https://my.sseairtricity.com/oss_web/" + $tr2.find("td:eq(1) a").attr("href"))
                                        .fetch(reframerOptions)
                                        .then(function ($html) {
                                            return "https://my.sseairtricity.com/oss_web/" + $html.find(".download").attr("href");
                                        }),
                                };
                            }));
                    })
                    .then(function (model) {
                        airtricity.expenses = model;
                        airtricity.loaded = true;
                        return model;
                    });
            },
            expenses: null
        };

        return airtricity;
    }]);
})();