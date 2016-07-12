console.log("Begin");
// chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
//   // Tab opened.
// });
chrome.browserAction.onClicked.addListener(function(activeTab)
{
    chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
      // Tab opened.
    });
  //chrome.tabs.create({ url: index.html; });
});
console.log("End");

