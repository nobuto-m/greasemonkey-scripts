// ==UserScript==
// @name           Word highlighter
// @namespace      http://murraytwins.com/greasemonkey/
// @description    Highlight keywords in bug pages
// @include        https://launchpad.net/*/+bug/*
// @include        https://*.launchpad.net/*/+bug/*
// @include        https://*.edge.launchpad.net/*/+bug/*
// @creator        Brian Murray <brian@ubuntu.com>
// 
// ==/UserScript==
// Based on http://userscripts.org/scripts/show/15637

(function()
{
    // Regex of words to highlight : color to highlight them (hint don't use black!)
    var color_map = {
        'DistroRelease:.*|SourcePackage:.*|lucid|karmic|jaunty|intrepid|hardy|dapper': "yellow", 
        'regression': "red",
    }; 

    for (var key in color_map) {
        search = '('+key+')';
        regex = new RegExp(search,'gi');
        rn = Math.floor(Math.random()*100);
        rid = 'z' + rn;
        body = document.body.innerHTML;
        body = body.replace(regex,'<span name=' + rid + ' id=' + rid + ' style=\'color:#000;background-color:'+ color_map[key] +';\'>$1</span>');
        void(document.body.innerHTML=body);
    }
})();
