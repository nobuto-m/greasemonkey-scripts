// ==UserScript==
// @name           LP_Karma_Suffix
// @namespace      http://outflux.net/greasemonkey/
// @description    (Launchpad) Karma Suffixes
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @version        1.1
// @date           2008-08-19
// @creator        Kees Cook <kees@ubuntu.com>
// ==/UserScript==

// ------  User settable data  -------------
//
// Teams to display emblems for

// show developer team logos last, so process them first

var teams = {
    'motu-swat':'',
//    'motu-release':'',
//    'motu-sru':'',
    'bugsquad':'',
    'ubuntu-core-dev':'',
    'ubuntu-dev':'',
    'universe-contributors':'',
    'ubuntu-bugcontrol':'',
    'ubuntumembers':''
};

// ------- End of User settable data -------

(function () {
  var SCRIPT = {
    name: "LP_Karma_Suffix",
    namespace: "https://code.launchpad.net/~ubuntu-dev/ubuntu-gm-scripts/ubuntu",
    description: '(Launchpad) Karma Suffixes',
    source: "http://codebrowse.launchpad.net/~ubuntu-dev/ubuntu-gm-scripts/ubuntu/files",
    identifier: "http://codebrowse.launchpad.net/~ubuntu-dev/ubuntu-gm-scripts/ubuntu/file/lp_karma_suffix.user.js",
    version: "1.1",
    date: (new Date(2009, 8 - 1, 19))// update date
    .valueOf()
  };

var debug = 0;

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
    if (debug)
        GM_log("Fetching '"+URL+"'");

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
    httpRequest.onreadystatechange = function() {
        if (debug)
            GM_log("State is "+httpRequest.readyState+" ("+httpRequest.status+") for '"+URL+"'");
        requestHandler(httpRequest, response_handler, response_arg);
    };

    // Make the request
    httpRequest.open ('GET', URL);
    //httpRequest.overrideMimeType('text/xhtml');
    httpRequest.overrideMimeType('text/xml');
    httpRequest.send (null);
}


var people_cache = new Array();

// Actually populates the visible HTML with fetched information.
// Called after team_handler and karma_handler have finished.
function augment_person(person)
{
    for (var idx in people_cache[person]['nodes']) {
         var node = people_cache[person]['nodes'][idx];

        for (var title in people_cache[person]['team']) {
            var logoNode = document.createElement('img');
            logoNode.title = title;
            logoNode.src = people_cache[person]['team'][title];
            node.parentNode.insertBefore(logoNode, node.nextSibling);
        }
       
        // add in karma value and last paren
        var karmaNode = document.createTextNode(': '+people_cache[person]['karma']+') ');
        node.parentNode.insertBefore(karmaNode, node.nextSibling);
        // add in contact user link
        var contactLink = document.createElement("a");
        contactLink.href = "https://launchpad.net/~" +person+ "/+contactuser";
        contactLink.title = "Contact this user";
        contactLink.innerHTML = person;
        node.parentNode.insertBefore(contactLink, node.nextSibling);
        // add in a 1st paren
        var firstNode = document.createTextNode(' (');
        node.parentNode.insertBefore(firstNode, node.nextSibling);
    }
}


// Handles extracting the karma details
function karma_handler(xmldoc, person)
{
    // The output of LP can't be used as an XML document, so we're forced
    // to build a screen-scraper!!  (LP #92853)
    var text = xmldoc.responseText.replace(/\n/g," ");

    if (debug)
        GM_log("Loaded /@@+portlet-details for '"+person+"'");

    var karma = '0';

    // XPath method... 
    //var results = xpath("//span[contains(@id,'karma-total')]", xmldoc.responseXML);
    //if (results.snapshotLength>0) {
    //    karma = results.snapshotItem(0).firstChild.nodeValue;
    //    //alert("Karma for "+person+": "+karma);
    //}

    // screen-scraping method...
    var span = '/+karma">';
    var karma_at = text.indexOf(span);
    if (karma_at>0) {
        var karma_all = text.substr(karma_at+span.length);
        karma = karma_all.substr(0,karma_all.indexOf("</a>"));
        if (debug)
            GM_log("Karma for "+person+": "+karma);
    }

    // store for later
    people_cache[person]['karma'] = karma;

    // end of chain, display
    augment_person(person);
}

// Handles extracting the team details
function team_handler(xmldoc, person)
{
    // The output of LP can't be used as an XML document, so we're forced
    // to build a screen-scraper!!  (LP #92853)
    var text = xmldoc.responseText.replace(/\n/g," ");

    if (debug)
        GM_log("Loaded /+participation for '"+person+"'");

    // skip non-humans (this will abort the fetching chain)
    if (text.indexOf('Show all members')>=0) {
        return;
    }

    var re = new RegExp('<a href="[^~"]*/~([^"]+)" class="bg-image" style="background-image: url\\((https://launchpadlibrarian\\.net/[^\\)]+)\\)',"ig");
    while ((match = re.exec(text)) != null) {
        title = match[1];
        src = match[2];
        if (title in teams) {
            people_cache[person]['team'][title] = src;
            if (debug)
                GM_log(title+' has URL '+src+' for '+person);
        }
    }

    // chain to next item to load...
    loadData(people_cache[person]['karma_link'], karma_handler, person);
}

function add_people(people)
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
        people_cache[person]['team_link'] = link + "/+participation";
        people_cache[person]['karma_link'] = link + "/@@+portlet-details";
        people_cache[person]['nodes'] = new Array();
        people_cache[person]['team'] = new Array();
        if (debug)
            GM_log("Found '"+person+"' ("+link+")");
    }
    people_cache[person]['nodes'].push(node);
  }
}

window.addEventListener("load", function(e) {
    var prefix = new Array("https://launchpad.net",
                           "https://bugs.launchpad.net",
                           "https://edge.launchpad.net",
                           "https://bugs.edge.launchpad.net",
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
    add_people(xpath("//*[@class='object timestamp']/"+a_clean_match));

    // Assignees
    add_people(xpath("//table[contains(@id,'affected-software')]//td/"+a_clean_match));

    // Everyone!  (this is totally insane for bugs with large dups)
    //add_people(xpath("//"+a_match));

    // Go fetch all found people's info and attach it to their nodes
    for (var person in people_cache) {
        loadData(people_cache[person]['team_link'], team_handler, person);
    }

}, false);

})();
