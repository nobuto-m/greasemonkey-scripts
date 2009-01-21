// ==UserScript==
// @name        LP_Patches
// @namespace   http://murraytwins.com/greasemonkey/
// @description Identify attachments flagged as patches
// @include     https://launchpad.net/*
// @include     https://*.launchpad.net/*
// @include     https://*.edge.launchpad.net/*
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

function requestHandler(req, fn, args, arg2)
{
    if (req.readyState == 4 && req.status == 200) {
        fn(req, args, arg2);
        //fn(req.responseXML, args);
        //fn(req.responseXML.documentElement, args);
    }
}

function loadData(URL, response_handler, response_arg, response_arg2)
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
    httpRequest.onreadystatechange = function() { requestHandler(httpRequest, response_handler, response_arg, response_arg2); };

    // Make the request
    httpRequest.open ('GET', URL);
    //httpRequest.overrideMimeType('text/xhtml');
    httpRequest.overrideMimeType('text/xml');
    httpRequest.send (null);
}

function patch_handler(xmldoc, librarian_link, comment) {
    var text = xmldoc.responseText.replace(/\n/g," ");

//    if (xpath("//input[contains(@name,'field.patch') and contains(@value,'on')]", xmldoc.responseText)) {
    var re = new RegExp("checked=\"checked\" id=\"field.patch\"");
    if ((match = re.exec(text)) != null) {
        if (debug) {
            GM_log("Patch found " + librarian_link);
        }
        librarian_link.parentNode.setAttribute("style", "list-style-image: url(" + star + ")");
        for (var j = 0; j < comment.snapshotLength; j++) {
            if (debug) 
                GM_log("Comment url " + comment.snapshotItem(j));
            if ( String(librarian_link) == String(comment.snapshotItem(j))) {
                comment.snapshotItem(j).parentNode.setAttribute("style", "list-style-image: url(" + star + ")");
            }
        } 
        
    }
}

star = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA%2FwD%2FAP%2BgvaeTAAAAB3RJTUUH1goWBRUW8tvU3gAAAVxJREFUKJGtkb1OAlEQhc%2Fc3b0QEAFJjGBhYmUiNMbYmdhZYelPzwPoK1j5DGa1s7EyMcbYaovBAgoKg0IhQSHosstyl8u1EaLhJ8Z4ypnzZU7mAP%2BtuonbhomLcXt9AruuJizZyGvHWCbObOLMbphI%2FhqEznZ5Yk7niVldMbYzykIAUDcxlGpqYw%2BQTbTuroegWAakf51dURrd8IVQxL%2BUMsi3BmjzgKwgnOZA9wluseSJZ6tJUm0OokYzyAlXJUXZytvZgqO8GiArQK8FJdqwsyVHlK28cFUymkFuELUvdQ7e%2BEAnsJqCEV8ElAfv5RHOfREz0%2FDRNsTgDd%2FBhoCfiDp6xPZ5lQcFAHqMETRy3yzlA8aA1EGahXnXLVR7otqWABSPBwwtZEh6F1sAzvreH3Uo0JFsdoLeq3spXRWXrkqImnMlmyIIRoejakG%2FlvoJ9ofmpzgYVdmf9Al84I7Jn6sOdQAAAABJRU5ErkJggg%3D%3D" 

window.addEventListener("load", function(e) {
//    GM_log('script running');

    var librarian = xpath("//div[contains(@id,'portlet-attachments')]//li[contains(@class,'download')]/a");
    var comment = xpath("//div[contains(@class,'boardCommentBody')]//ul//li[contains(@class,'download')]/a");
    if (debug) {
        GM_log("comment is "+comment);
        GM_log("librarian is "+librarian);
    }
    for (var i = 0; i < librarian.snapshotLength; i++) {
        var librarian_link = librarian.snapshotItem(i);
        var edit = xpath("//div[contains(@id,'portlet-attachments')]//li[contains(@class,'download')]/small/a");
        if (debug)
            GM_log("edit url "+edit.snapshotItem(i));
        var edit_link = edit.snapshotItem(i);
        loadData(edit_link, patch_handler, librarian_link, comment);
    }

  }, false);
})();
