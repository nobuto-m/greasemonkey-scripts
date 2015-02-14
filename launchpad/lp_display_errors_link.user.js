// ==UserScript==
// @name           LP_DisplayErrorBucket
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Add in a link to the errors bucket for the bug
// @include        https://bugs.launchpad.net/*/+bug/*
// @include        https://bugs.staging.launchpad.net/*/+bug/*
// @date           2013-11-21
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

    var answers = xpath("//li[contains(@class,'answers')]").snapshotItem(0);
    var bug_tags = xpath("//span[contains(@id, 'tag-list')]").snapshotItem(0).textContent;
    // Can't escape characters in LP.cache['bug'] so use and with
    // contains
    var cache = xpath("//script[contains(.,'LP.cache') and contains(.,'http_etag')]").snapshotItem(0).textContent;
    var bug_pattern = /"bug": .*/;
    var bug_data = cache.match(bug_pattern)[0];
    var num_pattern = /"id": \d+/;
    var bug_number = bug_data.match(num_pattern)[0];
    var bug_number = bug_number.split(": ")[1];
    var errors = document.createElement("li");
    errors.title = "Error report for this bug";
    errors.class = "errors";
    var errorsLink = document.createElement("a");
    errorsLink.href = "http://errors.ubuntu.com/bug/" + bug_number;
    errorsLink.innerHTML = "Errors";
    errors.appendChild(errorsLink);

    // check to make sure that the bug is an apport-crash
    if (bug_tags.search('apport-crash') != -1) {
        answers.parentNode.insertBefore(errors, answers.nextSibling);
    }

})();
