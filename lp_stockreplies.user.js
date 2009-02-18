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

var prefsData = new Object;
var prefsFields = new Array(
                            "name",       // required -- the clickable name
                            "comment",    // required -- the stock reply!
                            "status",     // "" == leave unchanged
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
  element.appendChild(innerTextElement);
  element.addEventListener('click', function(e) { 
    e.preventDefault(); 

    // Set comment
    xpath('//textarea[@id="'+  formname + '.comment_on_change"]').snapshotItem(0).value = prefsData['comment'][idx];

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

/* TODO: add an ability to have tooltips */
function insert_clickable(node, newElement, tagged)
{
    var span = document.createElement("span");
    var leftBrace = document.createTextNode('[');
    var rightBrace = document.createTextNode('] ');

    /* mark up for future removal? */
    if (tagged) {
        span.setAttribute('class','lp_stockreplies')
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
}

function loadStandardReplies() {
    GM_xmlhttpRequest
        (
          {
            method: 'GET',
            url:    'http://people.ubuntu.com/~brian/tmp/stock-replies.xml',
            headers: {
                'Accept': 'application/atom+xml,application/xml,text/xml',
            },
            onload:  function(results) {
                var parser = new DOMParser();
                var dom = parser.parseFromString(results.responseText,"application/xml");
                var replies = dom.getElementsByTagName('reply');
                // destory preferences for possible reload
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
                savePreferences();
                alert('Standard Replies Loaded');
            }
          }
        )
}

function addColumnPreference(idx,fieldname)
{
        var td = document.createElement('td');
        // why doesn't this alignment work?
        //td.setAttribute('valign','top');

        var id = 'lp_stockreplies.reply.' + idx + '.' + fieldname;

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
    comment_td.setAttribute('colspan', 5); // fixme: fieldnames - 2
    comment_tr.appendChild( comment_td );
    table.appendChild(comment_tr);

    // make the source readable
    table.appendChild(document.createTextNode("\n"));

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
    for (var idx = 0; idx < count; idx ++) {
        addRowPreferences(table, idx);
    }

    // Show pref-control buttons
    tr = document.createElement('tr');
    table.appendChild(tr);

    // Expand list
    var td = document.createElement('td');
    var click = document.createElement('a');
    click.href = document.location + "#";
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
    element.addEventListener('click', function(e) {
            e.preventDefault();

            loadStandardReplies();

            return false;
        }, false);
  return element;
}

var prefsDiv = null;
function hidePreferences() {
    var prefs = document.getElementById("lp_stockreplies_prefs");
    if (prefs) {
        prefs.parentNode.removeChild(prefs);
        prefsDiv = null;
    }
}

function popPreferences(title) {
    var element = document.createElement('a');
    element.href = document.location + "#";
    var innerTextElement = document.createTextNode(title);
    element.appendChild(innerTextElement);
    element.addEventListener('click', function(e) {
            e.preventDefault();

            // create the dialog if it doesn't exist yet
            if (prefsDiv === null) {
                prefsDiv = document.createElement('div');
                prefsDiv.setAttribute('id','lp_stockreplies_prefs');

                showPreferences(prefsDiv);
            }

            // locate the prior dialog location
            var prefs = document.getElementById("lp_stockreplies_prefs");
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
    var allReplies = xpath("//*[@class='lp_stockreplies']");
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
    // load standard replies if non already in the preferences
    if (!prefsData.standardSeen) {
        loadStandardReplies();
    }

    show_replies();

}, false);

})();
