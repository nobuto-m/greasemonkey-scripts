// ==UserScript==
// @name           LP_DisplayCountOfDupes
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Display the quantity of duplicates
// @include        https://bugs.launchpad.net/*
// @include        https://bugs.staging.launchpad.net/*
// @date           2011-03-28
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

    var duplicates_of = xpath("//div[contains(@id,'portlet-duplicates')]//h2").snapshotItem(0);
    // Can't escape characters in LP.cache['bug'] so use and with
    // contains
    var cache = xpath("//script[contains(.,'LP.cache') and contains(.,'bug')]").snapshotItem(0).textContent;
    var pattern = /"number_of_duplicates": \d+/;
    var number_of_dupes = cache.match(pattern)[0];
    var number_of_dupes = number_of_dupes.split(': ')[1]

    if (debug) {
        GM_log("duplicates_of" + duplicates_of.textContent);
        GM_log("number_of_dupes" + number_of_dupes);
    }

    duplicates_of.textContent += ' (' + number_of_dupes + ')';

})();
