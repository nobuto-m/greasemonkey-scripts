// ==UserScript==
// @name           LP_DetailedDescription
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Prefill bug description
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @date           2009-02-11
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==
// This would be more awesome if worked like buttontags
// and you could have different descriptions for different
// projects


(function() {

// ------  User settable data  -------------
// Description to use
var description = "Release of Ubuntu:\nPackage Version:\nExpected Results:\nActual Results:\n"

// ------- End of User settable data -------

function xpath(query, context) {
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function fillit() {

    // grab the part after bugs.launchpad.net - pathname looks like /ubuntu/+source/pkgname/+bug/1
    var pathname = window.location.pathname;
    // find the project name
    var project_name = pathname.split('/')[1]
    // project for the description to apply to
    if ( project_name == 'ubuntu' ) {
        if (xpath('//form[contains(@action,"filebug")]').snapshotItem(0)) {
            xpath('//textarea[@id="field.comment"]').snapshotItem(0).value = description;
        }
    }
  }
})(); 
