// ==UserScript==
// @name        LP_Patches
// @namespace   http://murraytwins.com/greasemonkey/
// @description Identify attachments flagged as patches
// @include     https://*.launchpad.net/*
// @include     https://*.edge.launchpad.net/*
// @include     https://launchpad.net/*
// @version     0.99
// @creator     Brian Murray <brian@ubuntu.com>
// ==/UserScript==

// GM_Log is not available in epiphany, so don't set debug = 1
var debug = 0;

(function() {

function xpath(query, context) {
 //     GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function requestHandler(req, fn, args)
{
    if (req.readyState == 4 && req.status == 200) {
        fn(req, args);
        //fn(req.responseXML, args);
        //fn(req.responseXML.documentElement, args);
    }
}

function loadData(URL, response_handler, response_arg)
{
    //alert("Fetching " + response_arg + " ("+URL+")");

    // Create the XML request
    var httpRequest;
    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
            httpRequest = new XMLHttpRequest();
            if (httpRequest.overrideMimeType) {
                httpRequest.overrideMimeType('text/xml');
                // See note below about this line
            }
    } else if (window.ActiveXObject) { // IE
            try {
                httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {}
            }
    }
    if (!httpRequest) {
        return null;
    }

    // Anonymous function to handle changed request states
    httpRequest.onreadystatechange = function() { requestHandler(httpRequest, response_handler, response_arg); };

    // Make the request
    httpRequest.open ('GET', URL);
    //httpRequest.overrideMimeType('text/xhtml');
    httpRequest.overrideMimeType('text/xml');
    httpRequest.send (null);
}

function patch_handler(xmldoc, edit_link) {
    var text = xmldoc.responseText.replace(/\n/g," ");

//    if (xpath("//input[contains(@name,'field.patch') and contains(@value,'on')]", xmldoc.responseText)) {
    var re = new RegExp("checked=\"checked\" id=\"field.patch\"");
    if ((match = re.exec(text)) != null) {
        if (debug)
            GM_log("Patch found " + edit_link);
        edit_link.parentNode.parentNode.className = "news";
    }
}

window.addEventListener("load", function(e) {
//    GM_log('script running');

    var edit = xpath("//div[contains(@id,'portlet-attachments')]//li[contains(@class,'download')]/small/a");
    for (var i = 0; i < edit.snapshotLength; i++) {
        if (debug)
            GM_log("edit url "+edit.snapshotItem(i));
        var edit_link = edit.snapshotItem(i);
        loadData(edit_link, patch_handler, edit_link);
    }

  }, false);
})();
