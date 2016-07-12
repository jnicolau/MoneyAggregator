/**
 * Created by joao on 14/02/2016.
 */
(function () {
    "use strict";

    // Payees Service
    app.service('aib', [function () {
        var reframerOptions = {
            authentication: Reframer.authentications.chromeExtension,
            isAuthenticated: function ($html) {
                return $html.find("form[name=loginstep1], form[name=loginstep2]").length === 0;
            },
            authenticationUrl: "https://onlinebanking.aib.ie/inet/roi/login.htm"
        };

        var portalUrl = "https://onlinebanking.aib.ie/inet/roi/login.htm";

        var me = {
            name: "AIB",
            logoUrl: "https://onlinebanking.aib.ie/roi-desktop/images/aib-logo.png",
            template: "aib.html",
            loaded: false,
            load: function () {
                return Reframer.executeScriptOnUrl(
                    "app/services/aib.tab.js",
                    "https://onlinebanking.aib.ie/inet/roi/login.htm")
                    .then(function (data) {
                        var categories = {};
                        function crawlCats(cats) {
                          cats.forEach(function (c) {
                            categories[c.catId] = c.catName;
                            crawlCats(c.categories);
                          });
                        }
                        crawlCats(data.categories);
                        var model = data.operations.operations.map(function(item) {
                          return {
                            Description: item.name,
                            "Date": item.postedDate,
                            Amount: item.amount,
                            Category: categories[item.catId]
                          };
                        });
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