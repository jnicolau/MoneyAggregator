/**
 * Created by joao on 07/02/2016.
 */

chrome.runtime.sendMessage({
    source: document.documentElement.innerHTML
});
