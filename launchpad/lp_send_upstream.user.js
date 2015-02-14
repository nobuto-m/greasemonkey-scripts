// ==UserScript==
// @name           LP_SendtUpstream
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) Forwards a bug report to bugzilla
// @include        https://bugs.launchpad.net/*
// @include        https://bugs.edge.launchpad.net/*
// @include        https://bugs.staging.launchpad.net/*
// ==/UserScript==

(function () {
  var SCRIPT = {
    name: "LP_SendUpstream",
    namespace: "http://bryceharrington.org/greasemonkey/",
    description: "(Launchpad) Forwards a bug to bugzilla",
    source: "http://bryceharrington.org/greasemonkey/",
    identifier: "http://bryceharrington.org/greasemonkey/lp_send_upstream.user.js",
    version: "0.1.0",
    date: (new Date(2009, 6 - 1, 29))// update date
    .valueOf()
  };

var debug = 1;

function xpath(query, context) {
 //     GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

// Sends data to url using HTTP POST, then calls the function cb with the response text as its single argument.
function post(url, data, cb) {
  GM_xmlhttpRequest({
    method: "POST",
    url: url,
    headers: {'Content-type':'application/x-www-form-urlencoded'},
//    data: encodeURIComponent(data),
//    data: encodeURI(data),
    data: data,
    onload: function(xhr) { cb(xhr.responseText); },
    onerror: function(responseDetails) {
	alert('Failed to set upstream link ' + responseDetails.status +
		' ' + responseDetails.statusText + '\n\n');
    },
    // onreadystatechange: function(responseDetails) { },
  });
}

// Retrieves url using HTTP GET, then calls the function cb with the response text as its single argument.
function get(url, cb) {
  GM_xmlhttpRequest({
    method: "GET",
     url: url,
     headers: {
        'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
        'Accept': 'text/xhtml,application/xml,text/html',
     },
     onload: function(xhr) { 
	if (xhr.status != 200) {
		alert("Failed to retrieve " + url + "\n" + xhr.statusText);
		return -1;
	}
	cb(xhr.responseText);
     },
     onerror: function(xhr) {
	alert('Failed get url ' + url + '\n' + responseDetails.status +
		' ' + responseDetails.statusText + '\n\n');
     }
  });
}

window.addEventListener("load", function(e) {
        // grab the part after bugs.launchpad.net - pathname looks like /ubuntu/+source/pkgname/+bug/1
        var pathname = window.location.pathname;
        var path = pathname.split('/');
        var project_name = path[1];

        var bugid = null;
        for (var item in path) {
            if (item>0 && path[item-1] == "+bug") {
                bugid = path[item];
            }
        }

        // project for the description to apply to
        if ( project_name == 'ubuntu' && bugid != null) {
            var link = xpath("//div[@class='actions']/a[@class='menu-link-addupstream sprite add']").snapshotItem(0);

            var upstreamLink = document.createElement('a');
            upstreamLink.setAttribute('class', "menu-link-forward-upstream sprite add");
            upstreamLink.title = "Forward upstream";
            upstreamLink.innerHTML = "Forward upstream";
            upstreamLink.href = "http://bryceharrington.org/cgi-bin/send_upstream.cgi?bug="+bugid+"&submit=Go";

            link.parentNode.insertBefore(upstreamLink, link);
        }


}, false);    

})();
