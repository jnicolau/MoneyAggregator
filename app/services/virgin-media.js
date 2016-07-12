/**
 * Created by joao on 14/02/2016.
 */
(function () {
    "use strict";

    // Payees Service
    app.service('virginMedia', [function () {
        var reframerOptions = {
            authentication: Reframer.authentications.chromeExtension,
            isAuthenticated: function ($html) {
                return $html.find("#lgi-mvno-ie-login-form").length === 0;
            },
            authenticationUrl: "https://www.virginmedia.ie/login"
        };

        var portalUrl = "https://www.virginmedia.ie/myvirginmedia/portal/";

        var me = {
            name: "Virgin Media",
            logoUrl: "https://www.virginmedia.ie/etc/designs/virginmedia-ie/media/logos/virgin_media.png",
            template: "virgin-media.html",
            loaded: false,
            load: function () {
                return portalUrl
                    .fetch(reframerOptions)
                    .then(function ($html) {
                        return (portalUrl + $html.find("#bills_payments .upc_actions a").attr("href"))
                            .fetch(reframerOptions)
                            .nestedPromises(function ($html2) {
                                return $html2.find("#table2-invoices tbody tr")
                                    .slice(0, 2)
                                    .map(function ($tr) {
                                        return {
                                            billAmount: $tr.find("td:eq(3)").text().wipe("€"),
                                            billDate: Date.parse($tr.find("td:eq(2)").text().trim()),
                                            billUrl: (portalUrl + $tr.find("td:eq(0) a:eq(1)").attr("href"))
                                                .fetch(reframerOptions)
                                                .then(function ($html) {
                                                    return portalUrl + $html.find("a.pdf_link").attr("href");
                                                })
                                        }
                                    })
                            });

                    })
                    .then(function (model) {
                        me.expenses = model;
                        me.loaded = true;
                        return model;
                    });
            },
            expenses: null
        };

        return me;
    }]);
})();