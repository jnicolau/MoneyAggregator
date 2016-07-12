/**
 * Created by joao on 02/02/2016.
 */
var Reframer = (function () {

    if (typeof jQuery === 'undefined') {
        throw "jQuery not available. Reframer needs jQuery.";
    }

    function loadHtml(url) {
        var deferred = $.Deferred();
        return $.get(url).then(function (html, status, xhr) {
            console.info("Url loaded: " + url);
            html = html.replace(/<img[^>]*>/g, ""); // strip images
            var $html = $($.parseHTML(html));
            return $html;
        });
    }

    function isPromise(obj) {
        return typeof(obj.then) === 'function';
    }

    function executeScriptOnTab(tabId, file) {
        var defer = $.Deferred();
        chrome.tabs.executeScript(tabId, {file: file},
            function () {
                if (chrome.runtime.lastError) {
                    console.error('There was an error injecting script: \n' + chrome.runtime.lastError.message);
                    defer.reject(chrome.runtime.lastError);
                } else {
                    //console.log("Injected " + file);
                    defer.resolve();
                }
            });
        return defer.promise();
    }

    function executeScriptsOnTab(tabId, files) {
        var defer = $.Deferred().resolve();
        files.forEach(function (file) {
            defer = defer.then(function () {
                return executeScriptOnTab(tabId, file);
            });
        });
        return defer.promise();
    }

    var noAuthentication = function (url) {
        return loadHtml(url);
    };

    var chromeExtensionAuthentication = function (url, isAuthenticated, authenticationUrl) {
        var deferred = $.Deferred();
        if (typeof(isAuthenticated) !== "function") {
            throw "Argument missing: isAuthenticatedFunction";
        }
        loadHtml(url)
            .done(function ($html) {
                if (isAuthenticated($html)) {
                    deferred.resolve($html);
                } else {
                    if (typeof(authenticationUrl) !== "string") {
                        throw "Argument missing: authenticationUrl";
                    }
                    // Open login tab and create listener
                    chrome.tabs.create({'url': authenticationUrl}, function (tab) {
                        var loaded = false;
                        var createdTabId = tab.id;
                        var onTabUpdate;
                        var onMessage;
                        chrome.tabs.onUpdated.addListener(onTabUpdate = function (tabId, changeInfo, tab) {
                            // Ignore pages not yet loaded
                            if (tabId !== createdTabId) {
                                return;
                            } else if (changeInfo.status === "loading") {
                                chrome.runtime.onMessage.removeListener(onMessage);
                                loaded = false;
                            } else if (!loaded && changeInfo.status === "complete") {
                                executeScriptsOnTab(createdTabId,
                                    ["lib/jquery/dist/jquery.min.js", "app/tab-script.js"]);
                                loaded = true;
                                chrome.runtime.onMessage.addListener(onMessage = function (response, sender) {
                                    if (sender.tab.id == createdTabId) {
                                        var html = response.source;
                                        html = html.replace(/<img[^>]*>/g, ""); // strip images
                                        var $html = $($.parseHTML(html));

                                        if (isAuthenticated($html)) {
                                            console.info("Authentication validated");
                                            // Close authentication tab
                                            chrome.tabs.onUpdated.removeListener(onTabUpdate);
                                            chrome.runtime.onMessage.removeListener(onMessage);
                                            chrome.tabs.remove(createdTabId);
                                            // Select our tab
                                            chrome.tabs.getCurrent(function (tab) {
                                                chrome.tabs.update(tab.id, {selected: true});
                                            });
                                            deferred.resolve($html);
                                        }
                                    }
                                });
                            }
                        });
                        chrome.tabs.onRemoved.addListener(function (tabId) {
                            chrome.tabs.onUpdated.removeListener(onTabUpdate);
                            chrome.runtime.onMessage.removeListener(onMessage);
                            deferred.reject();
                        });
                    });
                }

            })
            .fail(function (error) {
                deferred.reject("Error loading url " + url);
            });

        return deferred.promise();
    };

    var executeScriptOnUrl = function (scriptUrl, url) {
        var defer = $.Deferred();
        // Open login tab and create listener
        chrome.tabs.create({'url': url}, function (tab) {
            var createdTabId = tab.id;
            // Listen to web requests
            var webRequestsDetails;
            var onBeforeSendHeaders;
            chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders = function (details) {
                chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
                webRequestsDetails = details;
            }, {
                tabId: createdTabId,
                urls: ["https://onlinebanking.aib.ie/inet/roi/pfm.htm"]
            }, ['requestHeaders']);
            chrome.tabs.onUpdated.addListener(onTabUpdate = function (tabId, changeInfo, tab) {
                if (tabId !== createdTabId) {
                    return;
                }
                if (changeInfo.status === "complete") {
                    executeScriptsOnTab(createdTabId,
                        ["lib/jquery/dist/jquery.min.js", "app/reframer.js", scriptUrl])
                        .done(function(){
                            if (typeof webRequestsDetails !== 'undefined') {
                                chrome.tabs.sendMessage(createdTabId, webRequestsDetails);
                            }
                        });
                }
            });
            // Receive response
            chrome.runtime.onMessage.addListener(onTabIdMessage = function (response, sender) {
                if (sender.tab.id == createdTabId) {
                    console.log(response);
                    chrome.runtime.onMessage.removeListener(onTabIdMessage);
                    chrome.tabs.remove(createdTabId);
                    defer.resolve(response);
                }
            });
        });
        return defer.promise();

    };

    var defaultOptions = {
        authentication: noAuthentication,
        isAuthenticated: function ($html) {
            return true;
        },
        authenticationUrl: null
    };

    var fetch = function (url, options) {
        options = $.extend(defaultOptions, options);
        var authPromise = options.authentication(url, options.isAuthenticated, options.authenticationUrl);

        authPromise.nestedPromises = function (callback) {
            return authPromise.then(function ($html) {
                var obj = callback($html);
                return promise(obj);
            })
        }

        return authPromise;
    }

    fetch.defaults = defaultOptions;

    function deepCopy(o) {
        var copy = o, k;

        if (o && typeof o === 'object') {
            copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    copy[k] = deepCopy(o[k]);
                }
            }
        }

        return copy;
    }

    var promise = function (objOrArray) {
        var all = [];
        var copy = deepCopy(objOrArray);
        Object.traverse(copy, function (node, value, key, path, depth) {
            if (typeof value === "function") {
                return true;
            }
            //console.log(path + ": " + value);
            if (isPromise(value)) {
                all.push(
                    $.when(value).then(function (val) {
                        node[key] = val;
                        return val;
                    })
                );
                return true;
            }
        });
        return $.when(all).then(function () {
            return copy;
        });
    }

    // Extend String
    String.prototype.fetch = function (options) {
        return Reframer.fetch(this, options)
    };

    String.prototype.wipe = function (stringOrArray) {
        if (typeof stringOrArray === "string") {
            return this.replace(stringOrArray, "").trim();
        } else {
            var str = this;
            stringOrArray.forEach(function (el) {
                str = str.replace(el, "");
            });
            return str.trim();
        }
    };

    //String.prototype.toDate() = function (stringOrArray) {

    // Extend Array
    Array.prototype.pair = function () {
        var temp = this.slice(); // copy array
        var arr = [];
        while (temp.length) {
            arr.push(temp.splice(0, 2));
        }
        return arr;
    };

    Array.prototype.mapPairs = function (mapper) {
        var temp = this.slice(); // copy array
        var arr = [];
        while (temp.length) {
            var pair = temp.splice(0, 2);
            var mapped = mapper(pair[0], pair[1]);
            arr.push(mapped);
        }
        return arr;
    };

    // Extend jQuery
    $.fn.map = function (mapper) {
        var temp = this.slice(); // copy array
        var arr = [];
        while (temp.length) {
            var pair = temp.splice(0, 1);
            var mapped = mapper($(pair[0]));
            arr.push(mapped);
        }
        return arr;
    };

    $.fn.mapPairs = function (mapper) {
        var temp = this.slice(); // copy array
        var arr = [];
        while (temp.length) {
            var pair = temp.splice(0, 2);
            var mapped = mapper($(pair[0]), $(pair[1]));
            arr.push(mapped);
        }
        return arr;
    };

    $.fn.insertElementIf = function (index, el, ifFunction) {
        if (ifFunction()) {
            var $el = $(el);
            this.splice(index, 0, $el);
        }
        return this;
    };

    return {
        fetch: fetch,
        promise: promise,
        authentications: {
            chromeExtension: chromeExtensionAuthentication
        },
        executeScriptOnUrl: executeScriptOnUrl
    };

}());

