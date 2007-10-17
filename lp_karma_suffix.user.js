// ==UserScript==
// @name           LP_Karma_Suffix
// @namespace      http://outflux.net/greasemonkey/
// @description    (Launchpad) Karma Suffixes
// @include        https://*.launchpad.net/*
// @include        https://launchpad.net/*
// @version        0.9
// @date           2007-06-26
// @creator        Kees Cook <kees@ubuntu.com>
// ==/UserScript==

(function () {
  var SCRIPT = {
    name: "LP_Karma_Suffix",
    namespace: "http://outflux.net/greasemonkey/",
    description: '(Launchpad) Karma Suffixes',
    source: "http://outflux.net/greasemonkey/",
    identifier: "http://outflux.net/greasemonkey/lp_karma_suffix.user.js",
    version: "0.9",
    date: (new Date(2007, 6 - 1, 26))// update date
    .valueOf()
  };

function xpath(query, context) {
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



var people_cache = new Array();

function person_handler(xmldoc, person)
{
    //alert(stringObject(xmldoc,"xmldoc"));
    //alert(stringObject(xmldoc.responseText,"xmldoc.responseText"));
    //alert(stringObject(xmldoc.responseXML,"xmldoc.responseXML"));
    //alert(xmldoc.responseXML);

/*
    It seems that the output of LP can't be used as an XML document,
    so we're forced to build a screen-scraper!!  (LP #92853)

//    var results = xpath("//span[contains(@id,'karma-total')]", xmldoc);
//    var node = results.snapshotItem(0);
    var node = xmldoc.getElementById('karma-total');
    var karma = node.firstChild.nodeValue;
*/
    var text = xmldoc.responseText.replace(/\n/g," ");

    // skip non-humans
    if (text.indexOf('Show all members')>=0) {
        return;
    }

    /* show developer team logos last, so process them first */
    var teams = {
	'motu-swat':'',
	'bugsquad':'',
	'ubuntu-core-dev':'',
	'ubuntu-dev':'',
	'ubuntu-qa':'',
	'ubuntumembers':''
    };
    var re = new RegExp("<img[^>]* src=\"(https://launchpadlibrarian.net/[^\"]+)\"[^>]+>[^a]*<a[^>]* href=\"[^~\"]*/~([^\"]+)\"","ig");
    while ((match = re.exec(text)) != null) {
	if (match[2] in teams) {
	    //alert(match[2]+' is '+match[1]+' for '+person);
	    for (var idx in people_cache[person]['nodes']) {
		var node = people_cache[person]['nodes'][idx];
		var logoNode = document.createElement('img');
		logoNode.src = match[1];
		logoNode.title = match[2];
		node.parentNode.insertBefore(logoNode, node.nextSibling);
	    }
	}
    }

    /* add in karma */
    var karma = '0';
/* XPath method... 
    var results = xpath("//span[contains(@id,'karma-total')]", xmldoc.responseXML);
    if (results.snapshotLength>0) {
        karma = results.snapshotItem(0).firstChild.nodeValue;
        alert("Karma for "+person+": "+karma);
    }
*/
// screen-scraping method...
    var span = '<span id="karma-total">';
    var karma_at = text.indexOf(span);
    if (karma_at>0) {
        var karma_all = text.substr(karma_at+span.length);
        karma = karma_all.substr(0,karma_all.indexOf("<"));
        //alert("Karma for "+person+": "+karma);
    }

    for (var idx in people_cache[person]['nodes']) {
         var node = people_cache[person]['nodes'][idx];

         var karmaNode = document.createTextNode(' ('+karma+') ');
         node.parentNode.insertBefore(karmaNode, node.nextSibling);
    }
}

function add_people(people, debug)
{
  for (var i = 0; i < people.snapshotLength; i++) {
    var node = people.snapshotItem(i);
    var link = "" + node;

    var person  = link.substr(link.lastIndexOf("~")+1);

    // Detect and drop sub directory matches
    var slash = person.indexOf("/");
    if (slash != -1) {
        // fix up person name
        person = person.substr(0,slash);
        // fix up link
        link = link.substr(0,link.indexOf("/",link.indexOf("~")));
    }

    if (!people_cache[person]) {
        people_cache[person] = new Array();
        people_cache[person]['link'] = link + "/+participation";
        people_cache[person]['nodes'] = new Array();
        if (debug) 
            alert(person);
    }
    people_cache[person]['nodes'].push(node);
  }
}

window.addEventListener("load", function(e) {
    var prefix = new Array("https://launchpad.net",
                           "https://bugs.launchpad.net",
                           "");
    var url_clean_matches = new Array();
    var url_messy_matches = new Array();
    for (var idx in prefix) {
        url_clean_matches.push("(starts-with(@href, '"+prefix[idx]+"/~') and not(contains(substring-after(@href, '"+prefix[idx]+"/~'),'/')))");
        url_messy_matches.push("(starts-with(@href, '"+prefix[idx]+"/~') and contains(substring-after(@href, '"+prefix[idx]+"/~'),'/+'))");
    }
    var a_clean_match = "a["+url_clean_matches.join(" or ")+"]";
    var a_messy_match = "a["+url_messy_matches.join(" or ")+"]";
    
    // All the people links in the main content section (_not_ subscribers!)
    add_people(xpath("//div[contains(@id,'maincontent')]//"+a_clean_match));

    // Bug reporter
    add_people(xpath("//div[contains(@class,'portlet')]/h2[.='Bug details']/..//"+a_clean_match));

    // Assignees
    add_people(xpath("//div[contains(@id,'maincontent')]//table[contains(@class,'listing')]//td/"+a_messy_match));

    // Everyone!  (this is totally insane for bugs with large dups)
    //add_people(xpath("//"+a_match));

    // Go fetch all found people's karma and attach it to their nodes
    for (var person in people_cache) {
        loadData(people_cache[person]['link'], person_handler, person);
    }

}, false);

})();
