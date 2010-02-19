// This user script adds two columns to the launchpad search bugs page:
// Assigned to: Displays to whom a bug is currently assigned
// Age: Displays how long the bug has been opened
//
// ==UserScript==
// @name           Launchpad Bug Search improvements
// @namespace      https://launchpad.net/~javier.collado
// @description    Launchpad Bug Search extra columns
// @include        https://bugs.launchpad.net/*
// @include        https://bugs.edge.launchpad.net/*
// @include        https://bugs.staging.launchpad.net/*
// ==/UserScript==

// =============================================================================
// ============================ Configuration Values ===========================

// toggle features:
var removeHeat = true;          // remove the heat column?
var addAge = true;              // add an age column?
var shrinkImport = true;        // shrink the "Importance" column header

// Specify which tags you do *not* want to see in the tags column:
var uninterestingTags = [];
uninterestingTags["i386"] = true;
uninterestingTags["checkbox-bug"] = true;
uninterestingTags["apport-bug"] = true;
uninterestingTags["cqa-verified"] = true;
uninterestingTags["karmic"] = true;

// tweak display sizes:
var assigneeFontSize = "1.0em";
var tagFontSize = "0.75em";

// ========================== End Configuration Values =========================
// =============================================================================

var currentSortColumn = "Import";
if (!shrinkImport)
    currentSortColumn = "Importance";

function requestHandler(req, fn, args, arg2)
{
    if (req.readyState == 4 && req.status == 200) {
        //fn(req, args, arg2);
        //fn(req.responseXML, args);
        fn(req.responseXML.documentElement, args, arg2);
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

function calculate_age(registration_date) {
    today = new Date();
    var ms_day=1000*60*60*24;

    age = Math.floor((today.getTime() - registration_date.getTime())/ms_day);
    if (! age >= 1) {
	age = 0;
    }
    return age;
}

// This function is in charge of getting the bug owner
// and the reporting date so that this data can be added
// to the new columns in the bug search page
function bug_handler(xmldoc, bug_id, tr) {
    GM_log("Adding data for bug#" + bug_id);
    var owner = xmldoc.querySelector("table#affected-software td:nth-child(5) a");
    td = document.createElement('td');
    td.setAttribute("style", "font-size: " + assigneeFontSize + ";");
    if (owner) {
	td.appendChild(owner);
    } else {
	td.textContent = "Unassigned";
    }
    tr.appendChild(td);

    td = document.createElement('td');
    td.setAttribute("style", "font-size: " + tagFontSize + ";");
    var tagAElems = xmldoc.querySelectorAll("#tag-list>a");
    if (tagAElems.length) {
        var tagAElem;
        for (var i = 0; i < tagAElems.length; ++i) {
            var tagAElem = tagAElems[i];
            if (uninterestingTags[tagAElem.textContent] == undefined) {
                var a = document.createElement('a');
                a.href=tagAElem;
                a.textContent = tagAElem.textContent
                td.appendChild(a);
                td.appendChild(document.createElement('br'));
            }
        }
    } else {
        td.textContent = "None";
    }
    tr.appendChild(td);

    if (addAge) {
        var span = xmldoc.querySelector("#registration>span");
        var date = new Date(span.textContent.split(' ')[1].replace('-', ' ', 'g'));
        var age = calculate_age(date);
        td = document.createElement('td');
        td.textContent = age + ' day';
        if (age != 1) {
            td.textContent += 's';
        }
        tr.appendChild(td);
    }
}

// extract the parameters to the query and return as an object
function getURLParams()
{
    var params = [];
    items = window.location.search.split("&");
    var item;
    for (item in items)
    {
        var tmp = items[item].split("=", 2);
        params[tmp[0]] = tmp[1];
    }
    return params;
}

// work out what column a header name refers to
function getHeaderItemIndex(headerTR, name)
{
    var result = 0;
    var matchFound = false;

    var status = "";

    // work out the column index
    var headerItems = headerTR.querySelectorAll("th");
    for (var i = 0; i < headerItems.length; ++i) {
        var headerItem = headerItems[i];

        if (headerItem.textContent == name) {
            matchFound = true;
            break;
        }

        if (headerItem.getAttribute('colspan'))
            result += parseInt(headerItem.getAttribute('colspan'));
        else
            result++;

    }

    if (!matchFound)
        result = -1;
    else if (result == 0) // special case for summary
        result = 2;

    return result;
}

function valSort(left, right)
{
    if (left.val < right.val)
        return -1;
    else if (right.val < left.val)
        return 1;
    else return 0;
}

function sortByThisColumn()
{
    var columnIndex = getHeaderItemIndex(this.parentNode, this.textContent);
    if (columnIndex == -1)
    {
        alert("Failed to get column index");
        return;
    }

    var body = this.parentNode.parentNode.parentNode.querySelector("tbody");

    // pull all the items out of the table into sortItems
    var sortItems = [];
    var rows = body.querySelectorAll("tr");
    for (var i = 0; i < rows.length; ++i)
    {
        var row = rows[i];
        // make an item containing val and row attributes
        sortItems.push({val: row.querySelectorAll("td")[columnIndex].textContent, row: row});
        body.removeChild(row);
    }

    // decide whether to sort - if it's a new column
    var columnName = this.textContent;
    if (columnName != currentSortColumn)
        sortItems.sort(valSort);
    else
        sortItems.reverse();

    // record the sorted column name
    currentSortColumn = columnName;

    // repace items in table
    for (var i = 0; i < sortItems.length; ++i)
        body.appendChild(sortItems[i].row);
}

function main()
{
    // set the title based on the "title" parameter:
    params = getURLParams();
    if (params["title"]) {
        document.title = params["title"].replace(/%20/g, " ");
    }

    var bug_table = document.querySelector('#buglisting,#hot-bugs');
    if (!bug_table) {
	GM_log("Bug list not found. Exiting.");
	return;
    }

    GM_log("Adding column headers...");
    var table_header_row = bug_table.querySelector('thead>tr');
    var new_column;

    new_column = document.createElement('th');
    new_column.textContent = 'Assigned to';
    table_header_row.appendChild(new_column);
    
    new_column = document.createElement('th');
    new_column.textContent = 'Tags';
    table_header_row.appendChild(new_column);

    if (addAge) {
        new_column = document.createElement('th');
        new_column.textContent = 'Age';
        table_header_row.appendChild(new_column);
    }

    GM_log("Tweaking columns...");
    var heatColumn = -1;
    var table_header_items = bug_table.querySelectorAll('thead>tr>th');
    for (var i = table_header_items.length - 1; i >= 0; i--) {
        // remove heat column
        if (removeHeat && (-1 != table_header_items[i].textContent.indexOf("Heat"))) {
            table_header_row.removeChild(table_header_items[i]);
            heatColumn = i + 4; // extra columns at start
        } 
        // Shorten "Importance"
        else if (shrinkImport && (-1 != table_header_items[i].textContent.indexOf("Importance"))) {
            table_header_items[i].textContent = "Import";
        }
    }

    // add click sort action to each column
    for (var i = table_header_items.length - 1; i >= 0; i--) {
        var item = table_header_items[i];
        item.addEventListener("click", sortByThisColumn, true);
    }

    var table_body_rows = bug_table.querySelectorAll('tbody>tr');

    // remove Heat column data
    if (heatColumn >= 0) {
        for (var i = 0; i < table_body_rows.length; i++) {
            var table_body_row = table_body_rows[i];
            var child = table_body_row.querySelector('td:nth-child(' + heatColumn.toString() + ')');
            table_body_row.removeChild(child);
        }
    }

    // Add columns data for each bug
    for (var i = 0; i < table_body_rows.length; i++) {
        var table_body_row = table_body_rows[i];

        var bug_id = table_body_row.querySelector('td:nth-child(2)').textContent;
	GM_log(i + '/', table_body_rows.length +
 	       ': Retrieving page for bug#' + bug_id);

        var bug_url = table_body_row.querySelector('td:nth-child(3)>a').href;
	loadData(bug_url, bug_handler, bug_id, table_body_row);
    }
}

main();

