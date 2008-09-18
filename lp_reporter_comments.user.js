// ==UserScript==
// @name           LP_Reporter_Comments
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Identify comments from the reporter
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-08-24
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==

// ------  User settable data  -------------

// Color for the comment heading

var color = 'lightgrey';

// ------- End of User settable data -------/

(function() {

function xpath(query, context) {
//    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

window.addEventListener("load", function(e) {

    var debug = 0

    var reporter = xpath("//*[@class='object timestamp']/a").snapshotItem(0);

    if (debug) {
        GM_log( "reporter href " + reporter );
    }

    var commenters = xpath("//div[@class='boardCommentDetails']/a");
     
    for ( var i = 0; i < commenters.snapshotLength; i++ ) {
        var commenter = commenters.snapshotItem(i);
        if (debug) {
            GM_log( "commenter href " + commenter );
        } 

        if ( String(commenter) == String(reporter) ) {
            if (debug) {
                GM_log( "Found a match" );
            }

            var css_style = "background:" + color + ";";
            commenter.parentNode.setAttribute('style', css_style);
 
        }
    }

  }, false);
})(); 
