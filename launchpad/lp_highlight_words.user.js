// ==UserScript==
// @name           LP_WordHighlighter
// @namespace      http://murraytwins.com/greasemonkey/
// @description    Highlight keywords in bug pages
// @exclude        https://launchpad.net/*/+bug/*/+edit
// @exclude        https://launchpad.net/*/+bug/*/+nominate
// @exclude        https://*.launchpad.net/*/+bug/*/+edit
// @exclude        https://*.launchpad.net/*/+bug/*/+nominate
// @exclude        https://*.edge.launchpad.net/*/+bug/*/+edit
// @exclude        https://*.edge.launchpad.net/*/+bug/*/+nominate
// @include        https://launchpad.net/*/+bug/*
// @include        https://*.launchpad.net/*/+bug/*
// @include        https://*.edge.launchpad.net/*/+bug/*
// @creator        Brian Murray <brian@ubuntu.com>
// 
// ==/UserScript==
// Based on http://userscripts.org/scripts/show/15637

function xpath(query, context) {
  context = context ? context : document;
  return document.evaluate(query, context, null,
                           XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function()
{
    // Regex of words to highlight : color to highlight them (hint don't use black!)
    var color_map = {
        'DistroRelease: [^ ]+ [^ ]+|SourcePackage: [^ ]+|LiveMediaBuild:|InstallationMedia:': "yellow",  // things that might be helpful
        'focal|jammy|mantic|noble': "yellow",  // ubuntu-distro-info --supported
        'regression': "red", // critical importance
        'warty|hoary|breezy|dapper|edgy|feisty|gutsy|hardy|intrepid|jaunty|karmic|lucid|maverick|natty|oneiric|precise|quantal|raring|saucy|trusty|utopic|vivid|wily|xenial|yakkety|zesty|artful|bionic|cosmic|disco|eoan|groovy|hirsute|impish|kinetic|lunar': "orange", // ubuntu-distro-info --unsupported
        // SRU verification tags
        'verification-[a-z-]*needed': "yellow",
        'verification-[a-z-]*done': "lime",
        'verification-[a-z-]*failed': "red",
    }; 

    for (var key in color_map) {
        var search = '(.*?)('+key+')(.*)';
        var regex = new RegExp(search,'i');
        // Get all text nodes below elements with class report or boardComment
        var text = xpath("//*[@id = 'edit-description' or (@class and " +
            "contains(concat(' ', normalize-space(@class), ' '), ' boardComment ')" +
            ")]//text()");

        for (var i = 0; i < text.snapshotLength; i++) {
            var texti = text.snapshotItem(i);
            var textiparent = texti.parentNode;
            while ( (match = regex.exec(texti.textContent)) != null ) {
                // split texti up into parts
                span = document.createElement("span");
                span.style.background = color_map[key];
                span.style.color = "black";
                span.textContent = match[2];
                // Insert the colored match
                textiparent.insertBefore(span, texti);
                // Insert the text preceeding the match
                beforeText = document.createTextNode(match[1]);
                textiparent.insertBefore(beforeText, span);
                // The remaining text after the match
                texti.textContent = match[3];
            }
        }
    }
})();
