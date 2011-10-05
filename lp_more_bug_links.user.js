// ==UserScript==
// @name           LP_MoreBugLinks
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Add in more bug links
// @include        https://launchpad.net/*/+bugs
// @include        https://*.launchpad.net/*/+bugs
// @include        https://launchpad.net/*/+bugs*
// @include        https://*.launchpad.net/*/+bugs*
// @date           2010-10-26
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==

var debug = 0;
var me = getLoggedInUserLink();

// ------  User settable data  -------------
// List of additional links to display
var extra_links = new Array(
    '<a href="+bugs?search=Search&amp;field.status=INCOMPLETE_WITH_RESPONSE">Incomplete w/ response bugs</a>',
    '<a href="+bugs?search=Search&amp;field.status=FIXRELEASED">Fix Released bugs</a>',
    '<a href="+bugs?search=Search&amp;field.status=Expired">Expired bugs</a>',
    '<a href="+bugs?search=Search&amp;field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=">Bugs with branches</a>',
    '<a href="+bugs?search=Search&amp;field.bug_reporter='+me+'">Bugs I reported</a>',
    '<a href="+bugs?search=Search&amp;field.subscriber='+me+'">Bugs I am subscribed to</a>',
    '<a href="+bugs?search=Search&amp;field.bug_commenter='+me+'">Bugs I commented on</a>'
);
// url format example
//https://bugs.edge.launchpad.net/ubuntu/+source/xserver-xorg-video-intel/+bugs?field.searchtext=&orderby=-importance&field.status%3Alist=NEW&field.status%3Alist=INCOMPLETE_WITH_RESPONSE&field.status%3Alist=INCOMPLETE_WITHOUT_RESPONSE&field.status%3Alist=CONFIRMED&field.status%3Alist=TRIAGED&field.status%3Alist=INPROGRESS&field.status%3Alist=FIXCOMMITTED&assignee_option=any&field.assignee=&field.bug_reporter=&field.bug_supervisor=&field.bug_commenter=&field.subscriber=&field.tag=&field.tags_combinator=ANY&field.status_upstream-empty-marker=1&field.has_cve.used=&field.omit_dupes.used=&field.omit_dupes=on&field.affects_me.used=&field.has_patch.used=&field.has_branches.used=&field.has_branches=on&field.has_no_branches.used=&search=Search
// ------- End of User settable data -------

function xpath(query, context) {
    //    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function getLoggedInUserLink() {
    // Returns the lp username of the logged-in user.
    var forms = document.getElementsByTagName('form');
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        if (form.action.match(/[+]logout$/)) {
            href = form.getElementsByTagName('a')[0].href;
            if (debug) {
                GM_log("User href: "+href);
            }
            return href.split('~')[1];
        }
    }
}

(function() {

    var links_table = xpath("//table[contains(@class,'bug-links')]").snapshotItem(0);
    if (debug) {
        GM_log("table " + links_table);
    }

    var spacerRow = links_table.insertRow(-1);
    var spacerCell = spacerRow.insertCell(0);
    spacerCell.colSpan = '2';
    spacerCell.innerHTML = '<br>';

    for (var link in extra_links) {
        var new_row = links_table.insertRow(-1);
        var cell1 = new_row.insertCell(0);
        cell1.className = 'bugs-count';
        //cell1.style = 'padding-top: 1em;';
        cell1.innerHTML = '?';
        var cell2 = new_row.insertCell(1);
        cell2.className = 'bugs-link';
        cell2.innerHTML = extra_links[link];
    };

})();
