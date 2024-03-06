// ==UserScript==
// @name           LP_DisplayLastUpdated
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Display when the bug was last updated
// @include        https://bugs.launchpad.net/*/+bug/*
// @include        https://bugs.staging.launchpad.net/*/+bug/*
// @date           2011-02-14
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==

var debug = 0;

function xpath(query, context) {
    //    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                             XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {

    var reported_on = xpath("//div[contains(@id,'registration')]//time[contains(@title,'20')]").snapshotItem(0);
    // Can't escape characters in LP.cache['bug'] so use and with
    // contains
    var cache = xpath("//script[contains(.,'LP.cache') and contains(.,'http_etag')]").snapshotItem(0).textContent;
    var last_update_start = cache.indexOf('date_last_updated') + 21;
    // this only grabs the date YYYY-mm-dd might want to be more awesome
    // and show X minutes ago
    var last_updated = cache.substr(last_update_start, 10);

    if (debug) {
        GM_log("last_updated" + last_updated);
        GM_log("reported_on.html" + reported_on.textContent);
    }

    reported_on.textContent += ' and last updated on ' + last_updated;

})();
