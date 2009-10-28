// ==UserScript==
// @name           LP_Improvements
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Collection of scripts that modify Launchpad
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-08-24
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==

// ------  User settable data  -------------

// Color for the comment heading in reporter_comments()

// used in reporter_comments()
var color = 'lightgrey';

// used in identify patches()
var star = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA%2FwD%2FAP%2BgvaeTAAAAB3RJTUUH1goWBRUW8tvU3gAAAVxJREFUKJGtkb1OAlEQhc%2Fc3b0QEAFJjGBhYmUiNMbYmdhZYelPzwPoK1j5DGa1s7EyMcbYaovBAgoKg0IhQSHosstyl8u1EaLhJ8Z4ypnzZU7mAP%2BtuonbhomLcXt9AruuJizZyGvHWCbObOLMbphI%2FhqEznZ5Yk7niVldMbYzykIAUDcxlGpqYw%2BQTbTuroegWAakf51dURrd8IVQxL%2BUMsi3BmjzgKwgnOZA9wluseSJZ6tJUm0OokYzyAlXJUXZytvZgqO8GiArQK8FJdqwsyVHlK28cFUymkFuELUvdQ7e%2BEAnsJqCEV8ElAfv5RHOfREz0%2FDRNsTgDd%2FBhoCfiDp6xPZ5lQcFAHqMETRy3yzlA8aA1EGahXnXLVR7otqWABSPBwwtZEh6F1sAzvreH3Uo0JFsdoLeq3spXRWXrkqImnMlmyIIRoejakG%2FlvoJ9ofmpzgYVdmf9Al84I7Jn6sOdQAAAABJRU5ErkJggg%3D%3D"; 

// used in prefill_question_comment()
var question_comment = "Thank you for taking the time to report this issue and helping to make Ubuntu better. Examining the information you have given us, this does not appear to be a bug report so we are closing it and converting it to a question in the support tracker. We appreciate the difficulties you are facing, but it would make more sense to raise problems you are having in the support tracker at https://answers.launchpad.net/ubuntu if you are uncertain if they are bugs. For help on reporting bugs, see https://help.ubuntu.com/community/ReportingBugs#When%20not%20to%20file%20a%20bug."

// used in append_karma()
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

// used in append_karma()
var people_cache = new Array();

// ------- End of User settable data -------/

(function() {

function xpath(query, context) {
//    GM_log('xpath running');
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

function reporter_comments() {
    var reporter = xpath("//*[@class='registering']/a[@class='sprite person']").snapshotItem(0);

    if (debug) {
        GM_log( "reporter href " + reporter );
    }

    var commenters = xpath("//div[@class='boardCommentDetails']/a");
     
    for ( var i = 0; i < commenters.snapshotLength; i++ ) {
        var commenter = commenters.snapshotItem(i);
        if (debug) {
            GM_log( "commenter href " + commenter );
        } 

        if ( String(commenter) == String(reporter) ) {
            if (debug) {
                GM_log( "Found a match" );
            }

            var css_style = "background:" + color + ";";
            commenter.parentNode.setAttribute('style', css_style);
 
        }
    }
}

function identify_patches() {
    
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
}

function prefill_question_comment() {

    if (xpath('//div[@class="actions"]/input[@value="Convert this Bug into a Question"]').snapshotItem(0)) {
        xpath('//textarea[@id="field.comment"]').snapshotItem(0).value = comment;
    }
}
//from lp_karma_suffix.user.js
function augment_person(person) {
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
// from lp_karma_suffix.user.js
// Handles extracting the karma details
function karma_handler(xmldoc, person) {
    // The output of LP can't be used as an XML document, so we're forced
    // to build a screen-scraper!!  (LP #92853)
    var text = xmldoc.responseText.replace(/\n/g," ");

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
// from lp_karma_suffix.user.js
// Handles extracting the team details
function team_handler(xmldoc, person) {
    // The output of LP can't be used as an XML document, so we're forced
    // to build a screen-scraper!!  (LP #92853)
    var text = xmldoc.responseText.replace(/\n/g," ");

    // skip non-humans (this will abort the fetching chain)
    if (text.indexOf('Show all members')>=0) {
        return;
    }

    var re = new RegExp("<img[^>]* src=\"(https://launchpadlibrarian.net/[^\"]+)\"[^>]+>[^a]*<a[^>]* href=\"[^~\"]*/~([^\"]+)\"","ig");
    while ((match = re.exec(text)) != null) {
        title = match[2];
        src = match[1];
        if (title in teams) {
            people_cache[person]['team'][title] = src;
            if (debug)
                GM_log(title+' has URL '+src+' for '+person);
        }
    }

    // chain to next item to load...
    loadData(people_cache[person]['karma_link'], karma_handler, person);
}
// from lp_karma_suffix.user.js
function add_people(people) {
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
        people_cache[person]['email_link'] = link + "/@@+portlet-email";
        people_cache[person]['nodes'] = new Array();
        people_cache[person]['team'] = new Array();
        if (debug)
            GM_log(person);
    }
    people_cache[person]['nodes'].push(node);
  }
}
// from lp_karma_suffix.user.js
function append_karma() {
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
}

window.addEventListener("load", function(e) {

    var debug = 0
    
    reporter_comments();
    identify_patches();
    prefill_question_comment();
    append_karma();
  
    }, false);
})(); 
