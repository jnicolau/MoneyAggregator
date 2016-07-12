// loginstep1
if ($("form[name=loginstep1]").length > 0) {
    $("#regNumber_id").val("28280454");
    $("#nextButton").click();
}

// After authentication
if ($("form[name=loginstep1], form[name=loginstep2]").length === 0) {
    if (window.location.pathname === "/inet/roi/login.htm") {
        $("#moneymanager_button_id").click();
    }
    if (window.location.pathname === "/inet/roi/pfmspending.htm") {
        var month = new Date().getMonth();
        var done = false;
        var onMessage;
        chrome.runtime.onMessage.addListener(onMessage = function (request, sender) {
            if (done)
                return;
            done = true;
            console.log("receiving message in tab");
            var headers = {};
            request.requestHeaders.forEach(function (h) {
                if (h.name == "Origin" ||
                    h.name == "User-Agent" ||
                    h.name == "Referer" ||
                    h.name == "Accept-Encoding" ||
                    h.name == "Cookie"
                ) {
                    return;
                }
                headers[h.name] = h.value;
            });
            var before = "authKey = '";
            var after = "';";
            var text = $("script:contains(authKey)").text();
            var start = text.indexOf(before) + before.length;
            var end = text.indexOf(after, start);
            var authKey = text.substring(start, end);
            console.log(authKey);
            var today = new Date();
            var from = new Date(today);
            from.setDate(15);
            from.setMonth(today.getMonth() - 2);
            var to = new Date(today);
            to.setDate(1);
            to.setDate(to.getDate() - 1);
            var model = {};
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
                    var data = {};
                    data.operations = $.parseJSON(data1[0]).result;
                    data.categories = $.parseJSON(data2[0]).result;
                    console.log("sending response from tab");
                    chrome.runtime.sendMessage(data);
                    chrome.runtime.onMessage.removeListener(onMessage);
                }).fail(function (error) {
                    console.log(error);
                }
            );
        });
    }
}

