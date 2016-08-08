/**
 * Created by joao on 21/07/2016.
 */
(function () {
    "use strict";

    // Get current tab
    var currentTab;
    chrome.tabs.getCurrent(function (tab) {
        currentTab = tab;
    });

    // Dashboard Controller
    app.controller("dashboardController",
        ["$scope", "accountsService", "$timeout", "$filter", "mockService", "Papa", function
            ($scope, accountsService, $timeout, $filter, mockService, papa) {

            // Variables:
            var me = this;
            var selected = false;
            var loginUrl = "https://onlinebanking.aib.ie/inet/roi/login.htm";

            // Scope:
            me.accounts = accountsService.getAccounts().map(function (a) { a.statements = []; return a; });
            me.statements = [];
            me.demoMode = false;

            // Functions:

            // Check if a string contains a substring
            function contains(searchText, inText) {
                return inText.toString().toUpperCase().indexOf(me.searchText.toUpperCase()) > -1;
            }

            // Filter statements for a given searchText
            function searchStatements(item) {
                if (me.searchText === null || me.searchText === undefined || me.searchText === '') {
                    return true;
                }
                if (typeof(item) === 'object') {
                    if (contains(me.searchText, item.account.shortName))
                        return true;
                    for (var key in item) {
                        var value = item[key];
                        if (key === "Date" && contains(me.searchText, $filter('date')(value, 'dd-MM-yyyy'))) {
                            return true;
                        }
                        else if (typeof(value) === 'object') {
                            continue;
                        }
                        else if (contains(me.searchText, value)) {
                            return true;
                        }
                    }
                }
                return false;
            }

            // Select all visible statements
            function selectAll() {
                selected = !selected;
                var statements = me.statements.filter(me.searchStatements);
                statements.forEach(function(s) {
                    s.selected = selected;
                });
            }

            // Log on/off an account
            function switchAccount(account) {
                console.log(account.onlineStatus);

                // If authenticated it must remain on
                if (account.isAuthenticated && account.onlineStatus === "on") {
                    return;
                }
                // When clicking while indetermined the tab is closed
                else if (account.openedTabId !== undefined && account.onlineStatus === "on") {
                    account.onlineStatus = "off";
                }

                // Events
                var onBeforeSendHeaders;
                var onCommitted;
                var onMessage;

                switch (account.onlineStatus) {
                    case "on":
                        // Set it to indeterminate
                        account.onlineStatus = null;

                        $timeout(function () {

                            var question = "In order to load your account statements you are required to login to your bank account. "
                                + "This process needs to be done in a new tab.\nDo you want to proceed?";
                            if (confirm(question)) {

                                // Open login tab and create listener
                                chrome.tabs.create(
                                    {
                                        'url': loginUrl,
                                        'index': currentTab.index + 1,
                                    }, function (tab) {
                                    account.openedTabId = tab.id;

                                    // Wait for the tab to open
                                    chrome.webNavigation.onCommitted.addListener(onCommitted = function (e) {
                                        if (e.tabId === tab.id && e.frameId === 0) {

                                            // Execute scripts on target tab
                                            executeScriptsOnTab(e.tabId,
                                                ["lib/jquery/dist/jquery.min.js", "app/aib.js"])
                                                .done(function () {

                                                    // Send current tab id, target tab id and request details
                                                    chrome.tabs.sendMessage(e.tabId,
                                                        {
                                                            type: 'tabId',
                                                            tabId: e.tabId,
                                                            senderTabId: currentTab.id,
                                                            isAuthenticated: account.isAuthenticated,
                                                            timeRange: account.timeRange,
                                                            loading: account.loading
                                                        });

                                                });
                                        }
                                    }, {url: [{urlPrefix: "https://onlinebanking.aib.ie"}]});

                                    // Listen to messages from the opened tab
                                    chrome.runtime.onMessage.addListener(onMessage = function (message, sender) {
                                        if (sender.tab.id === account.openedTabId) {
                                            messageHandler(account, message);
                                        }
                                    });

                                    // On tab closed: release all stuff
                                    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
                                        if (tabId === tab.id) {
                                            if (account.openedTabId) {
                                                account.openedTabId = undefined;
                                                account.isAuthenticated = false;
                                                account.onlineStatus = "off";
                                                if (onBeforeSendHeaders)
                                                    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
                                                if (onBeforeSendHeaders)
                                                    chrome.webNavigation.onCommitted.removeListener(onBeforeSendHeaders);
                                                if (onMessage)
                                                    chrome.runtime.onMessage.removeListener(onMessage);
                                                $scope.$apply();
                                            }
                                        }
                                    });
                                });

                            } else {
                                account.onlineStatus = "off";
                            }

                        }, 100);
                        break;

                    case "off":
                        if (account.openedTabId) {
                            chrome.tabs.remove(account.openedTabId, function () {
                            });
                        }
                        break;
                }
            };

            // Load statements
            function load (account) {
                if (me.demoMode && account.onlineStatus !== "on") {
                    mock(account);
                    return;
                }
                account.loading = true;
                // Can't load if account is off
                if (account.onlineStatus !== "on") {
                    account.onlineStatus = "on";
                    return;
                }
                // Send message for loading
                chrome.tabs.sendMessage(account.openedTabId, {type: 'load', account: account});
            }

            // Mock some statements for a given account
            function mock (account) {
                mockService.statements.forEach(function (s) {
                    var copy = angular.copy(s);
                    copy.account = account;
                    account.statements.push(copy);
                    me.statements.push(copy);
                });
            }

            // Delete statements
            function deleteStatements (account) {
                account.statements.forEach(function (s) {
                    var index = me.statements.indexOf(s);
                    if (index !== -1) {
                        me.statements.splice(index, 1);
                    }
                });
                account.statements = [];
            }

            // Export selected statements or all statements if none is selected
            function exportStatements (account) {
                var selected;
                if (account != undefined) {
                    selected = account.statements;
                } else {
                    selected = me.statements.filter(function (s) { return s.selected; });
                    if (selected.length === 0 && me.statements.length > 0)
                        selected = me.statements;
                }
                if (selected.length === 0) {
                    alert("There are no statements to be exported.")
                    return;
                }
                if (selected.length === 0)
                    selected = me.statements;
                selected = selected.map(statementToYnab);
                selected = $filter('orderBy')(selected, "-Date");
                papa.unparse(selected, { rejectOnError: true })
                    .then(function (csv) {
                        console.log(csv);
                        var now = new Date();
                        var filename = (account !== undefined ? account.shortName.replace(" ", "_") : "Statements")
                            + "_" + $filter('date')(now, 'dd-MM-yyyy_HHmmss') + ".csv";
                        var data = encodeURI('data:text/csv;charset=utf-8,' + csv);
                        var link = document.createElement('a');
                        link.setAttribute('href', data);
                        link.setAttribute('download', filename);
                        link.click();
                    })
                    .catch(function (result) {
                        alert(result.error)
                    });
            }

            // YNAB statement format
            function statementToYnab (statement) {
                return {
                    Date: statement.Date,
                    Payee: statement.Payee,
                    Category: statement.Category,
                    Memo: statement.Description,
                    Outflow: statement.Amount < 0 ? statement.Amount * -1 : '',
                    Inflow: statement.Amount >= 0 ? statement.Amount : '',
                };
            }

            // Handle a message for a given account
            function messageHandler (account, message) {
                switch (message.type) {
                    case "logged-in":
                        chrome.tabs.update(currentTab.id, {"active": true});
                        chrome.tabs.update(account.openedTabId, {
                            //pinned: true,
                        });
                        account.isAuthenticated = true;
                        account.onlineStatus = "on";

                        // If it's loading
                        if (account.loading) {
                            chrome.tabs.sendMessage(account.openedTabId, {type: 'load'});
                        }

                        $scope.$apply();
                        break;
                    case "logged-out":
                        account.isAuthenticated = false;
                        account.onlineStatus = "off";
                        $scope.$apply();
                        break;
                    case "loaded":
                        var randomInt = function (min, max) {
                            return Math.floor(Math.random() * (max - min)) + min;
                        };
                        var random = function (min, max) {
                            return (Math.random() * (max - min)) + min;
                        };
                        var statements = aibDataToStatements(message.data);
                        if (me.demoMode) {
                            statements.forEach(function (s) {
                                s.Description = mockService.statements[randomInt(0, mockService.statements.length)].Description;
                                s.Amount = s.Amount < 0 ? -1 * random(1, 1000) : random(1, 1000);
                            });
                        }
                        account.loading = false;
                        //console.log(JSON.stringify(statements));
                        me.deleteStatements(account);
                        account.statements = statements;
                        statements.forEach(function (s) {
                            s.account = account;
                            me.statements.push(s);
                        });
                        $scope.$apply();
                        break;
                }
            }

            // AIB data -> statements
            function aibDataToStatements(data) {
                //console.log(data);
                var categoryMap = {};
                function transverseCategories(cats) {
                    cats.forEach(function (c) {
                        categoryMap[c.catId] = c.catName;
                        transverseCategories(c.categories);
                    });
                }
                transverseCategories(data.categories);

                var statements = data.operations.operations.map(function (item) {
                    return {
                        Description: item.name,
                        "Date": item.postedDate,
                        Amount: item.amount,
                        Category: categoryMap[item.catId]
                    };
                });
                return statements;
            }

            // Close all tabs on exit
            window.onbeforeunload = function(){
                me.accounts.forEach(function(account) {
                    if (account.openedTabId) {
                        chrome.tabs.remove(account.openedTabId, function () {
                        });
                    }
                });
                return null;
            };

            // Publish functions
            angular.extend(me, {
                searchStatements: searchStatements,
                selectAll: selectAll,
                switchAccount: switchAccount,
                load: load,
                mock: mock,
                deleteStatements: deleteStatements,
                exportStatements: exportStatements,
            });
        }]
    );

    function executeScriptOnTab(tabId, file) {
        var defer = $.Deferred();
        chrome.tabs.executeScript(
            tabId,
            {runAt: "document_start", file: file},
            function (results) {
                if (chrome.runtime.lastError) {
                    var message = 'There was an error injecting script: \n' + chrome.runtime.lastError.message;
                    console.error(message);
                    alert(message);
                    defer.reject(chrome.runtime.lastError);
                } else {
                    console.log("Injected '" + file + "'");
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

})();