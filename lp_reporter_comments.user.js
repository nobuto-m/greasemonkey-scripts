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

function xpath(query, context) {
//    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {
    var debug = 0;

    var reporter = xpath("//*[@class='registering']/a[@class='sprite person']").snapshotItem(0);

    if (debug) {
        GM_log( "reporter href " + reporter );
    }

    // comments appear differently depending on whether or not they are an action comment or a regular comment
    // using a separate variable, commenters and actors, for each one to properly set the sytle's color
    // probably not the most efficient but it works
    var commenters = xpath("//div[@class='boardCommentDetails']/table/tbody/tr/td/a[@class='sprite person']");
     
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
            commenter.parentNode.parentNode.parentNode.parentNode.parentNode.setAttribute('style', css_style);
 
        }
    }


    var actors = xpath("//div[@class='boardCommentDetails']/a[@class='sprite person']");
     
    for ( var i = 0; i < actors.snapshotLength; i++ ) {
        var actor = actors.snapshotItem(i);
        if (debug) {
            GM_log( "actor href " + commenter );
        } 

        if ( String(actor) == String(reporter) ) {
            if (debug) {
                GM_log( "Found a match" );
            }

            var css_style = "background:" + color + ";";
            actor.parentNode.setAttribute('style', css_style);
 
        }
    }

})(); 
