// ==UserScript==
// @name           LP_BugSquadSignature
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Fill comment fields with a signature
// @exclude        https://bugs.launchpad.net/*/+filebug
// @include        https://bugs.launchpad.net/*
// @date           2011-05-20
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==


// ------  User settable data  -------------
// Signature to use
var signature = "\n---\nUbuntu Bug Squad volunteer triager\nhttp://wiki.ubuntu.com/BugSquad";
// Enable or disabled debugging
var debug = 0;

// ------- End of User settable data -------

function xpath(query, context) {
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {

    // grab the part after bugs.launchpad.net - pathname looks like /ubuntu/+source/pkgname/+bug/1
    var pathname = window.location.pathname;
    // find the project name
    var project_name = pathname.split('/')[1]
    // only use the Bug Squad signature if you are viewing an Ubuntu bug task
    if (project_name == 'ubuntu') {
        xpath('//textarea[@id="field.comment"]').snapshotItem(0).value = signature;
        // This would get overwritten by a stock reply
        //xpath('//textarea[@id="'+project_name+'".comment_on_change"]').snapshotItem(0).value = signature;
    }
    if (debug) {
        GM_log("project" + project_name);
    }
})();

