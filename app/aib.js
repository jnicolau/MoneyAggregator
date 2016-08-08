/**
 * Created by joao on 30/07/2016.
 */

var context;

var isAuthenticated = function() { return $("script:contains(authKey)").length > 0;  };
var authKey;

// Listening for a message from parent tab
chrome.runtime.onMessage.addListener(function (message) {
    messageHandler(message)
});


var messageHandler = function(message) {
    switch (message.type) {
        case "tabId":
            context = message;
            break;

        case "load":
            // Navigate to the money manager
            if (window.location.pathname !== "/inet/roi/pfmspending.htm") {
                $("#moneymanager_button_id").click();
            } else {
                fetchStatements(message.account);
            }
            break;
    }
};



// Load data from API
function fetchStatements(account) {
    if (window.location.pathname === "/inet/roi/pfmspending.htm") {
        var headers = [{
            "name": "Accept",
            "value": "*/*"
        }, {
            "name": "Origin",
            "value": "https://onlinebanking.aib.ie"
        }, {
            "name": "X-Requested-With",
            "value": "XMLHttpRequest"
        }, {
            "name": "User-Agent",
            "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
        }, {
            "name": "Content-Type",
            "value": "application/x-www-form-urlencoded; charset=UTF-8"
        }, {
            "name": "Referer",
            "value": "https://onlinebanking.aib.ie/inet/roi/login.htm"
        }, {
            "name": "Accept-Encoding",
            "value": "gzip, deflate, br"
        }, {
            "name": "Accept-Language",
            "value": "en-GB,en;q=0.8,en-US;q=0.6,pt-PT;q=0.4,pt;q=0.2"
        }];
        var today = new Date();
        var from = new Date(today);
        from.setDate(1);
        from.setMonth(today.getMonth() - account.timeRange);
        var to = new Date(today);
        to.setDate(1);
        to.setDate(to.getDate() - 1);
        var promise1 = $.ajax({
            method: "POST",
            url: "/inet/roi/pfm.htm",
            headers: headers,
            data: {
                "params.fromDateStr": from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate(),
                "params.toDateStr": to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate(),
                "numberOfItems": 100000,
                "firstPosition": 0,
                "namespace": "details",
                "action": "get",
                "authKey": authKey
            },
        });
        var promise2 = $.ajax({
            method: "POST",
            url: "/inet/roi/pfm.htm",
            headers: headers,
            data: {
                "namespace": "categories,get",
                "action": "all",
                "authKey": authKey
            }
        });
        $.when(promise1, promise2)
            .done(function (data1, data2) {
                var operations = $.parseJSON(data1[0]).result;
                var categories = $.parseJSON(data2[0]).result;

                var message = { type: 'loaded', data: {
                    operations: operations,
                    categories: categories
                }};
                // console.log("Sending response message from tab");
                // console.log(message);
                chrome.runtime.sendMessage(message);
            }).fail(function (error) {
                console.log(error);
                alert(error);
            }
        );
    }
};


$("body").ready(function(){

    // Detect if authentication is completed or not
    if (isAuthenticated()) {
        // Get authKey
        var before = "authKey = '";
        var after = "';";
        var text = $("script:contains(authKey)").text();
        var start = text.indexOf(before) + before.length;
        var end = text.indexOf(after, start);
        authKey = text.substring(start, end);
        console.log(authKey);

        // If loading fetch statements
        if (context.loading === true) {
            fetchStatements();
        }

        // It's online!: inform parent tab
        if (!context.isAuthenticated && window.location.pathname === "/inet/roi/login.htm") {
            //alert("Now that you are authenticated you can load your statements.");
            chrome.runtime.sendMessage({ type: "logged-in", senderTabId: context.senderTabId });
        }
    } else if (context.isAuthenticated) {
        chrome.runtime.sendMessage({ type: "logged-out", senderTabId: context.senderTabId });
    }
});