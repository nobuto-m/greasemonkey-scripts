// ==UserScript==
// @name           LP_HideDeletedPpas
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) Don't display PPAs that have been deleted
// @include        https://launchpad.net/~*
// @include        https://edge.launchpad.net/*
// @date           2011-09-08
// @creator        Bryce Harrington <bryce@canonical.com>
// ==/UserScript==

var debug = 1;

// ------  User settable data  -------------
// ------- End of User settable data -------

function xpath(query, context) {
    //    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {

    var items = xpath("//a[contains(@class,'sprite ppa-icon-inactive')]");
    for (var i = 0; i < items.snapshotLength; i++) {
        var node = items.snapshotItem(i);
        var table_cell = node.parentNode;
        var table_row = table_cell.parentNode;
        var table = table_row.parentNode;
        if (debug) {
            GM_log("item " + node);
            GM_log("parent " + table_row);
        }
        table.removeChild(table_row);
    }

})();
