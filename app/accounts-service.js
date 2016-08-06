/**
 * Created by joao on 21/07/2016.
 */
// Accounts Service
app.service('accountsService', [function (airtricity, virginMedia, aib) {

    var accounts = [
        {
            id: 1,
            type: "AIB",
            name: "AIB Account 1",
            shortName: 'AIB 1',
            timeRange: 3, // months
            onlineStatus: false,
            color: '#5D9CEC',
            isExpanded: true
        },
        {
            id: 2,
            type: "AIB",
            name: "AIB Account 2",
            shortName: 'AIB 2',
            timeRange: 3, // months
            onlineStatus: false,
            color: '#FFCE54',
            isExpanded: false
        },
        {
            id: 3,
            type: "AIB",
            name: "AIB Account 3",
            shortName: 'AIB 3',
            timeRange: 3, // months
            onlineStatus: false,
            color: '#ED5565',
            isExpanded: false
        }
    ];
    return {
        getAccounts: function() {
            return accounts;
        },
        setAccount: function(account) {
            var found = accounts.find(function(a) { return a.id == account.id; });
            if (found.length < 1)
                accounts.push(account);
            else
                found[0] = account;
        }
    }

    }]);