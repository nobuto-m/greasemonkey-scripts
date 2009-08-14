// ==UserScript==
// @name           LP_StockReplies
// @namespace      http://outflux.net/greasemonkey/
// @description    (Launchpad) Stock replies
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @version        1.3
// @date           2009-02-17
// @creator        Kees Cook <kees@ubuntu.com>
// @contributor    Brian Murray <brian@ubuntu.com>
// @contributor    Bryce Harrington <bryce@ubuntu.com>
// ==/UserScript==
// Based on code originally written by:
//  Tollef Fog Heen <tfheen@err.no>
//  Brian Murray <brian@ubuntu.com>

(function () {
  var SCRIPT = {
    name: "LP_StockReplies",
    namespace: "http://outflux.net/greasemonkey/",
    description: '(Launchpad) Stock replies',
    source: "http://codebrowse.launchpad.net/~ubuntu-dev/ubuntu-gm-scripts/ubuntu/files",
    identifier: "http://codebrowse.launchpad.net/~ubuntu-dev/ubuntu-gm-scripts/ubuntu/file/lp_stockreplies.user.js",
    version: "1.3",
    date: (new Date(2009, 2 - 1, 17))// update date
    .valueOf()
  };

function xpath(query, context) {
  context = context ? context : document;
  return document.evaluate(query, context, null,
                           XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

String.prototype.ucFirst = function () {
    return this.substr(0,1).toUpperCase() + this.substr(1,this.length);
};

var prefsData = new Object;
var prefsFields = new Array(
                            "name",       // required -- the clickable name
                            "comment",    // required -- the stock reply!
                            "status",     // "" == leave unchanged
                            "tip",        // tooltip hint (optional)
                            "assign",     // "" == leave unchanged
                                          // "-me" == assign to self
                                          // "-nobody" == assign to nobody
                            "importance", // "" == leave unchanged
                            "package",    // "" == leave unchanged
                            "standard"    // "yes" == is from standard XML?
                           );


function injectStockreply(formname, idx) {

  var element = document.createElement('a');
  element.href = document.location + "#";
  var innerTextElement = document.createTextNode(prefsData['name'][idx]);
  element.title = prefsData['tip'][idx];
  element.appendChild(innerTextElement);
  element.addEventListener('click', function(e) { 
    e.preventDefault(); 

    // Retrieve bug details
    var pathname = window.location.pathname;
    var bug_project = pathname.split('/')[1].ucFirst();
    var bug_package = pathname.split('/')[3];
    var bug_number = pathname.split('/').pop();
    var bug_reporter = xpath("//*[@class='object timestamp']/a").snapshotItem(0).firstChild.nodeValue;
    var bug_upstream_url = xpath("//*[@class='link-external']").snapshotItem(0).href;

    // Set comment
    var comment_text = prefsData['comment'][idx];
    comment_text = comment_text.replace("PROJECTNAME", bug_project);
    comment_text = comment_text.replace("BUGNUMBER", bug_number);
    comment_text = comment_text.replace("PKGNAME", bug_package);
    comment_text = comment_text.replace("REPORTER", bug_reporter);
    comment_text = comment_text.replace("UPSTREAMBUG", bug_upstream_url);
    xpath('//textarea[@id="'+  formname + '.comment_on_change"]').snapshotItem(0).value = comment_text;

    // Set status
    if (prefsData['status'][idx] != "") {
        xpath('//select[@id="'+  formname + '.status"]/option[.="'+prefsData['status'][idx].replace(/"/,'\\"')+'"]').snapshotItem(0).selected = true;
    }

    // Set assignee
    if (prefsData['assign'][idx] != "") {
        if (prefsData['assign'][idx] == "-me") {
            xpath('//input[@value="'+ formname + '.assignee.assign_to_me"]').snapshotItem(0).checked = true;
        }
        else if (prefsData['assign'][idx] == "-nobody") {
            xpath('//input[@value="'+ formname + '.assignee.assign_to_nobody"]').snapshotItem(0).checked = true;
        }
        else {
            xpath('//input[@value="'+ formname + '.assignee.assign_to"]').snapshotItem(0).checked = true;
            xpath('//input[@id="'+  formname + '.assignee"]').snapshotItem(0).value = prefsData['assign'][idx];
        }
    }

    // Set package
    if (prefsData['package'][idx] != "") {
        xpath('//input[@name="'+  formname + '.sourcepackagename"]').snapshotItem(0).value = prefsData['package'][idx];
    }

    // Set importance
    if (prefsData['importance'][idx] != "") {
        xpath('//select[@id="'+  formname + '.importance"]/option[.="'+prefsData['importance'][idx].replace(/"/,'\\"')+'"]').snapshotItem(0).selected = true;
    }

    // Subscribe triager by default
    var sub = xpath('//input[@id="subscribe"]').snapshotItem(0);
    if (sub) sub.checked = true;

    return false;
  }, false);
  return element;
}

var reply_class = 'lp_sr';
function insert_clickable(node, newElement, tagged)
{
    var span = document.createElement("span");
    var leftBrace = document.createTextNode('[');
    var rightBrace = document.createTextNode('] ');

    /* mark up for future removal? */
    if (tagged) {
        span.setAttribute('class',reply_class)
    }

    /* fill span */
    span.appendChild(leftBrace);
    span.appendChild(newElement);
    span.appendChild(rightBrace);
    // make the source readable
    span.appendChild(document.createTextNode("\n"));

    /* insert span */
    node.insertBefore(span, span.nextSibling);
}

function deleteReply(idx)
{
    var count = parseInt(GM_getValue('count',0))
    if (count == 0) return;
    if (idx >= count) return;
    if (idx < 0) return;
    /* move all the prefs up one to wipe out the deleted one */
    for (var move = idx + 1; move < count; move ++) {
        for (var field in prefsFields) {
            for (var field in prefsFields) {
                var fieldname = prefsFields[field];
                GM_setValue(fieldname+(move-1),GM_getValue(fieldname+move,""));
            }
        }
    }
    GM_setValue('count',''+(count-1))
    /* since we've deleted a reply, we'll need to reload this script's
       view of the GM prefs */
    loadPreferences()
}

function clearStandardReplies()
{
    var count = parseInt(GM_getValue('count', 0));
    for (var idx = 0; idx < count; ) {
        standard = GM_getValue('standard'+idx,"");
        if (standard == "yes") {
            count --;
            deleteReply(idx);
        }
        else {
            idx ++;
        }
    }
}

function loadPreferences()
{
    prefsData.standardSeen = false;
    prefsData.count = parseInt(GM_getValue('count', 0));
    for (var field in prefsFields) {
        var fieldname = prefsFields[field];
        prefsData[fieldname] = new Array;

        for (var idx = 0; idx < prefsData.count; idx ++) {
            prefsData[fieldname][idx] = GM_getValue(fieldname+idx,"");
        }
    }
    for (var idx = 0; idx < prefsData.count; idx ++) {
        if (prefsData['standard'][idx] == "yes") {
            prefsData.standardSeen = true;
        }
    }
    prefsData.reloadAt = parseInt(GM_getValue('reload-at', 0));
}

function loadStandardReplies() {
    GM_xmlhttpRequest
        (
          {
            method: 'GET',
            url:    'http://people.ubuntu.com/~brian/greasemonkey/bugsquad-replies.xml',
            headers: {
                'Accept': 'application/atom+xml,application/xml,text/xml',
            },
            onload:  function(results) {
                var parser = new DOMParser();
                var dom = parser.parseFromString(results.responseText,"application/xml");
                var replies = dom.getElementsByTagName('reply');
                // destroy preferences for possible reload
                hidePreferences();
                /* if we actually have some replies, clear the old ones */
                if (replies.length>0) {
                    clearStandardReplies();
                }
                var base = prefsData.count;
                for (var i=0; i < replies.length; i++) {
                    var standardReply = new Array;
                    for (var field in prefsFields) {
                        var fieldname = prefsFields[field];
                        var text;
                        if (fieldname == "standard") {
                            text = "yes";
                        }
                        else {
                            text = replies[i].getElementsByTagName(fieldname)[0].textContent;
                        }
                        prefsData[fieldname][base+i] = text;
                    }
                }
                prefsData.count += replies.length;
                // reload again in 1.5 days
                var time = new Date();
                prefsData.reloadAt = time.getUTCMilliseconds() + (1000 * 60 * 60 * 36);
                savePreferences();
            }
          }
        )
}

function addColumnPreference(idx,fieldname)
{
        var td = document.createElement('td');
        // why doesn't this alignment work?
        //td.setAttribute('valign','top');

        var id = reply_class + '.' + idx + '.' + fieldname;

        var label = document.createElement('label');
        label.setAttribute('style','font-weight: bold;');
        label.setAttribute('for',id);
        label.appendChild(document.createTextNode(fieldname));
        td.appendChild(label);

        var input;
        if (fieldname == 'comment') {
            input = document.createElement('textarea');
            // match current LP comment field size
            input.setAttribute('cols','62');
            input.setAttribute('rows','4');
        }
        else {
            input = document.createElement('input');
            input.setAttribute('type','text');
            input.setAttribute('size','15');
        }
        input.value = prefsData[fieldname][idx];
        input.setAttribute('name',fieldname);
        input.setAttribute('id',id);
        //alert('added ('+fieldname+','+idx+'): '+input.value);
        input.addEventListener('change', function(e) {
                e.preventDefault();

                var obj = e.target;
                var fieldname = obj.getAttribute('name');
                //alert('changed ('+fieldname+','+idx+'): '+obj.value);
                if (prefsData[fieldname][idx] != obj.value) {
                    /* mark as non-standard if it was changed */
                    prefsData['standard'][idx] = "";
                }
                prefsData[fieldname][idx] = obj.value;

                return false;
            }, false);
        td.appendChild(input);

        // make the source readable
        td.appendChild(document.createTextNode("\n"));

    return td;
}

function addRowPreferences(table,idx)
{
    /* TODO: mark this row in some way if it is a standard reply */
    var tr = document.createElement('tr');
    for (var field in prefsFields) {
        var fieldname = prefsFields[field];
        if (fieldname == 'standard') continue;
        if (fieldname == 'comment') continue;

        // set up empty default
        if (!prefsData[fieldname][idx]) {
            prefsData[fieldname][idx]="";
        }

        td = addColumnPreference(idx,fieldname);
        tr.appendChild(td);
    }
    table.appendChild(tr);

    // make the source readable
    table.appendChild(document.createTextNode("\n"));

    // add "comment" input separately since it is a textarea
    var comment_tr = document.createElement('tr');
    var comment_td = addColumnPreference(idx,'comment');
    comment_td.setAttribute('colspan', prefsFields.length - 2);
    comment_tr.appendChild( comment_td );
    table.appendChild(comment_tr);

    // make the source readable
    table.appendChild(document.createTextNode("\n"));

    // spacer
    var sep_td = document.createElement('td');
    var sep_tr = document.createElement('tr');
    sep_td.appendChild(document.createTextNode("\u00A0")); // nbsp
    sep_tr.appendChild( sep_td );
    table.appendChild( sep_tr );

    // did we bump the count higher?
    if (prefsData.count == idx) {
        prefsData.count++;
    }
}

function showPreferences(prefsDiv)
{
    var tr;
    var table = document.createElement('table');
    prefsDiv.appendChild(table);

    // get the count and initialize arrays
    var count = prefsData.count;

/*
    // table headers
    tr = document.createElement('tr');
    table.appendChild(tr);

    for (var field in prefsFields) {
        var fieldname = prefsFields[field];
        if (fieldname == 'standard') continue;
        if (fieldname == 'comment') continue;

        var th = document.createElement('th');
        // why doesn't this alignment work?
        //th.setAttribute('align','left');
        th.appendChild(document.createTextNode(fieldname));
        tr.appendChild(th);
    }
*/

    // load the preferences
    var reload_time_seen = false;
    for (var idx = 0; idx < count; idx ++) {

        if (prefsData['standard'][idx] == 'yes' && !reload_time_seen) {
            var time = new Date();
            time.setUTCMilliseconds( prefsData.reloadAt );

            var sep_tr;
            var sep_td;

            // spacer
            sep_td = document.createElement('td');
            sep_tr = document.createElement('tr');
            sep_td.appendChild(document.createTextNode("\u00A0")); // nbsp
            sep_tr.appendChild( sep_td );
            table.appendChild( sep_tr );

            // report auto-reload time
            sep_tr = document.createElement('tr');
            sep_td = document.createElement('td');
            var sep_span = document.createElement('span');
            sep_td.setAttribute('colspan', prefsFields.length - 2);
            sep_span.appendChild(document.createTextNode("Standard Replies (next auto-reload at: "+ time.toString() +")"));
            sep_span.setAttribute('style','font-weight: bold;');
            sep_td.appendChild( sep_span );
            sep_tr.appendChild( sep_td );
            table.appendChild( sep_tr );

            // spacer
            sep_td = document.createElement('td');
            sep_tr = document.createElement('tr');
            sep_td.appendChild(document.createTextNode("\u00A0")); // nbsp
            sep_tr.appendChild( sep_td );
            table.appendChild( sep_tr );

            reload_time_seen = true;
        }

        addRowPreferences(table, idx);
    }

    // Show pref-control buttons
    tr = document.createElement('tr');
    table.appendChild(tr);

    // Expand list
    var td = document.createElement('td');
    var click = document.createElement('a');
    click.href = document.location + "#";
    click.title = "Expand form with a new blank entry for stock replies (remember to click save!)";
    click.appendChild(document.createTextNode("Add New Stock Reply"));
    click.addEventListener('click', function(e) {
            e.preventDefault();

            addRowPreferences(table, prefsData.count);

            return false;
        }, false);
    insert_clickable(td, click, false);
    tr.appendChild(td);

    // Save preferences
    var td = document.createElement('td');
    var click = document.createElement('a');
    click.title = "Save the stock replies to disk (Important Note:  You will need to restart firefox for the replies to save permanently)";
    click.href = document.location + "#";
    click.appendChild(document.createTextNode("Save Stock Replies"));
    click.addEventListener('click', function(e) {
            e.preventDefault(); 

            savePreferences();

            alert('Replies Saved');

            return false;
        }, false);
    insert_clickable(td, click, false);
    tr.appendChild(td);

}

function savePreferences()
{
    // save the count
    GM_setValue('count', ''+prefsData.count);
    // save standard-reply-reload date
    GM_setValue('reload-at', ''+prefsData.reloadAt);

    // save the preferences
    for (var idx = 0; idx < prefsData.count; idx ++) {
        for (var field in prefsFields) {
            //alert("Saving "+prefsFields[field]+idx);
            GM_setValue(prefsFields[field]+idx, prefsData[prefsFields[field]][idx]);
        }
    }

    // redisplay the prefs!
    remove_replies();
    show_replies();
}

/*
function reloadReplies(title) {
    var element = document.createElement('a');
    element.href = document.location + "#";
    var innerTextElement = document.createTextNode(title);
    element.title = "Reload the replies from preferences";
    element.appendChild(innerTextElement);
    element.addEventListener('click', function(e) {
            e.preventDefault();

            remove_replies();
            show_replies();

            return false;
        }, false);
  return element;
}
*/
function reloadStandardReplies(title) {
    var element = document.createElement('a');
    element.href = document.location + "#";
    var innerTextElement = document.createTextNode(title);
    element.appendChild(innerTextElement);
    element.title = "Reload the standard replies from remote website";
    element.addEventListener('click', function(e) {
            e.preventDefault();

            loadStandardReplies();
            alert('Standard Replies Loaded');

            return false;
        }, false);
  return element;
}

var prefsDiv = null;
var prefsId = 'lp_sr_prefs';
function hidePreferences() {
    var prefs = document.getElementById(prefsId);
    if (prefs) {
        prefs.parentNode.removeChild(prefs);
        prefsDiv = null;
    }
}

function popPreferences(title) {
    var element = document.createElement('a');
    element.href = document.location + "#";
    var innerTextElement = document.createTextNode(title);
    element.title = "Display the stock replies preferences form";
    element.appendChild(innerTextElement);
    element.addEventListener('click', function(e) {
            e.preventDefault();

            // create the dialog if it doesn't exist yet
            if (prefsDiv === null) {
                prefsDiv = document.createElement('div');
                prefsDiv.setAttribute('id',prefsId);

                showPreferences(prefsDiv);
            }

            // locate the prior dialog location
            var prefs = document.getElementById(prefsId);
            if (!prefs || (prefs.parentNode != element.parentNode)) {
                // if prefs already exists in the DOM, drop it from prior
                // location, so we can attach it to the current element.
                /* oh, this seems to happen automatically.  Thanks, DOM.
                if (prefs) {
                    prefs.parentNode.removeChild(prefs);
                }
                */
                element.parentNode.insertBefore(prefsDiv, prefsDiv.nextSibling);
            }
            else {
                prefs.parentNode.removeChild(prefs);
            }

            return false;
        }, false);
  return element;
}

function remove_replies() {
    var allReplies = xpath("//*[@class='"+reply_class+"']");
    for (var i = 0; i < allReplies.snapshotLength; i++) {
        var thisReply = allReplies.snapshotItem(i);
        thisReply.parentNode.removeChild(thisReply);
    }
}

function show_replies() {
  var allForms = xpath("//form");
  for (var i = 0; i < allForms.snapshotLength; i++) {
    var thisForm = allForms.snapshotItem(i);
    var thisInput = xpath(".//input[contains(@name, '.sourcepackagename') or contains(@name, '.product')]", thisForm);
    if (thisInput.snapshotLength == 0) {
        continue;
    }
    var formname = thisInput.snapshotItem(0).name;
    formname = formname.substr(0, formname.lastIndexOf("."));
    var thisSubmit = xpath(".//label[contains(@for, '.comment_on_change')]", thisForm).snapshotItem(0);
  
    // append all stock replies
    for (var idx = 0; idx < prefsData.count; idx++) {
        insert_clickable(thisSubmit.parentNode,
                         injectStockreply(formname, idx), true);
    }

    // Add preferences "button"
    insert_clickable(thisSubmit.parentNode, popPreferences("+edit+"), true);
    //insert_clickable(thisSubmit.parentNode, reloadReplies("*"), true);
    insert_clickable(thisSubmit.parentNode, reloadStandardReplies("+reload+"), true);

  }
}

window.addEventListener("load", function(e) {

    loadPreferences();
    // load standard replies if none are already in the preferences, or
    // if the "reloadAt" preference has expired
    var time = new Date();
    if (!prefsData.standardSeen ||
        time.getUTCMilliseconds() > prefsData.reloadAt) {
        loadStandardReplies();
    }

    show_replies();

}, false);

})();
