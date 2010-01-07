// ==UserScript==
// @name           LP_WordHighlighter
// @namespace      http://murraytwins.com/greasemonkey/
// @description    Highlight keywords in bug pages
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
        'DistroRelease:.*|SourcePackage:.*|lucid|karmic|jaunty|intrepid|hardy|dapper': "yellow",  // things that might be helpful
        'regression': "red", // critical importance
        'gutsy|feisty|edgy|breezy|hoary|warty': "orange", // unsupported releases
    }; 

    for (var key in color_map) {
        search = '('+key+')';
        regex = new RegExp(search,'gi');
        rn = Math.floor(Math.random()*100);
        rid = 'z' + rn;
        text = xpath("//text()");
        for (var i = 0; i < text.snapshotLength; i++) {
            if ( text.snapshotItem(i).parentNode ) {
                if ( regex.exec(text.snapshotItem(i).textContent) != null ) {
                    text.snapshotItem(i).parentNode.innerHTML = text.snapshotItem(i).textContent.replace(regex,'<span name=' + rid + ' id=' + rid + ' style=\'color:#000;background-color:'+ color_map[key] +';\'>$1</span>');
                }
            }
        }
    }
})();
