// ==UserScript==
// @name           LP_StockReplies
// @namespace      http://outflux.net/greasemonkey/
// @description    (Launchpad) Stock replies
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @version        1.2
// @date           2007-11-27
// @creator        Kees Cook <kees@ubuntu.com>
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
    version: "1.2",
    date: (new Date(2007, 11 - 1, 27))// update date
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
                            "package"     // "" == leave unchanged
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

    return false;
  }, false);
  return element;
}

function insert_clickable(node, newElement)
{
    var leftBrace = document.createTextNode('[');
    var rightBrace = document.createTextNode('] ');
    node.insertBefore(leftBrace, leftBrace.nextSibling);
    node.insertBefore(newElement, newElement.nextSibling);
    node.insertBefore(rightBrace, rightBrace.nextSibling);
}

function loadPreferences()
{
    prefsData.count = parseInt(GM_getValue('count', 0));
    for (var field in prefsFields) {
        var fieldname = prefsFields[field];
        prefsData[fieldname] = new Array;

        for (var idx = 0; idx < prefsData.count; idx ++) {
            prefsData[fieldname][idx] = GM_getValue(fieldname+idx,"");
        }
    }
}

function addRowPreferences(table,idx)
{
    var tr = document.createElement('tr');
    table.appendChild(tr);

    for (var field in prefsFields) {
        var fieldname = prefsFields[field];

        // set up empty default
        if (!prefsData[fieldname][idx]) {
            prefsData[fieldname][idx]="";
        }

        var td = document.createElement('td');
        var input = document.createElement('input');
        input.setAttribute('type','text');
        input.setAttribute('name',fieldname);
        input.value = prefsData[fieldname][idx];
        //alert('added ('+fieldname+','+idx+'): '+input.value);
        input.addEventListener('change', function(e) {
                e.preventDefault();

                var obj = e.target;
                var fieldname = obj.getAttribute('name');
                //alert('changed ('+fieldname+','+idx+'): '+obj.value);
                prefsData[fieldname][idx] = obj.value;

                return false;
            }, false);
        td.appendChild(input);
        tr.appendChild(td);
    }

    // did we bump the count higher?
    if (prefsData.count == idx) {
        prefsData.count++;
    }
}

function showPreferences(prefsDiv)
{
    var table = document.createElement('table');
    prefsDiv.appendChild(table);

    var tr = document.createElement('tr');
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
    insert_clickable(td, click);
    tr.appendChild(td);
    
    // Save preferences
    var td = document.createElement('td');
    var click = document.createElement('a');
    click.href = document.location + "#";
    click.appendChild(document.createTextNode("Save Stock Replies"));
    click.addEventListener('click', function(e) { 
            e.preventDefault(); 

            savePreferences();

            alert('Saved (reload for new replies or changed names)');

            return false;
        }, false);
    insert_clickable(td, click);
    tr.appendChild(td);

    tr = document.createElement('tr');
    table.appendChild(tr);

    // get the count and initialize arrays
    var count = prefsData.count;
    for (var field in prefsFields) {

        var th = document.createElement('th');
        th.setAttribute('align','left');
        th.appendChild(document.createTextNode(prefsFields[field]));
        tr.appendChild(th);
    }

    // load the preferences
    for (var idx = 0; idx < count; idx ++) {
        addRowPreferences(table, idx);
    }
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
}

var prefsDiv = null;
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

                //innerTextElement.value = "-";
            }
            else {
                prefs.parentNode.removeChild(prefs);

                //innerTextElement.value = "+";
            }

            return false;
        }, false);
  return element;
}

window.addEventListener("load", function(e) {

  loadPreferences();

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
                         injectStockreply(formname, idx));
    }

    // Add preferences "button"
    insert_clickable(thisSubmit.parentNode, popPreferences("+"));

  }
}, false);

})();
