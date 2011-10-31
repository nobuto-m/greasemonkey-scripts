// ==UserScript==
// @name           LP_OopsToBug
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) When Launchpad breaks, link the OOPS to +filebug
// @include        https://*launchpad.net/*
// @date           2011-10-04
// @creator        Bryce Harrington <bryce@canonical.com>
// ==/UserScript==

function xpath(query, context) {
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {

    var items = xpath("//code[contains(@class,'oopsid')]");
    for (var i = 0; i < items.snapshotLength; i++) {
        var node = items.snapshotItem(i);
        var oopsid = node.innerHTML;
        node.innerHTML = '<a href="https://bugs.launchpad.net/launchpad/+filebug?field.title='
            + oopsid + '&field.comment=' + oopsid + '">' + oopsid + "</a>";
    }

})();


