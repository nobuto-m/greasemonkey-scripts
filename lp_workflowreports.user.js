// ==UserScript==
// @name           LP_Workflow
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Identify workflow reports
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-05-05
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==


(function() {

// ------  User settable data  -------------
// List of special teams whose bugs shouldn't be meddled with
var special_subscribers = {
    'ubuntu-archive':'<br>Workflow report',
    'ubuntu-release':'<br>Workflow report',
    'ubuntu-universe-sponsors':'<br>Workflow report',
    'ubuntu-main-sponsors':'<br>Workflow report',
    'motu-release':'<br>Workflow report',
    'ubuntu-mir':'<br>Workflow report'
}
// ------- End of User settable data -------

function xpath(query, context) {
//    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

window.addEventListener("load", function(e) {

    var debug = 0

    var bug_heading = xpath("//h1[contains(@id,'bug-title')]/span").snapshotItem(0);
    if (debug) {
        GM_log( "title " + bug_heading.innerHTML );
    }
   
    var current_subscribers = xpath("//div[contains(@id,'subscribers-direct')]/div/a")
    for ( var i = 0; i < current_subscribers.snapshotLength; i++ ) {
        var node = current_subscribers.snapshotItem(i);
        var link = "" + node;
        var person = link.substr(link.lastIndexOf("~")+1);  
        if (debug) {
            GM_log( "subscribers " + person );
        } 

        if ( person in special_subscribers ) {
            if (debug) {
                GM_log( "Special subscriber is " + person );
            }
            
            var special_K = document.createElement("h1");
            special_K.sytle = "clear: left;";
            special_K.innerHTML = special_subscribers[person];
            bug_heading.parentNode.insertBefore(special_K, bug_heading); 
            return;
        }
    }

  }, false);
})(); 
