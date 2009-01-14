// ==UserScript==
// @name           LP_BugActivityComment
// @namespace      http://thekorn.com/greasemonkey/
// @description    (Launchpad) Show bug timeline
// @include        https://bugs.launchpad.net/*
// @include        https://bugs.edge.launchpad.net/*
// @version        0.2
// @date           2008-09-08
// @creator        Markus Korn <thekorn@gmx.de>
// ==/UserScript==

var debug = 0;
var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Anonymous function wrapper
(function() {

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

function create_commentbody(elements) {
    var special_K = document.createElement("p");
    for (var k = 0; k < elements.length; k++) {
        entry = elements[k];
        entry_what_lst = entry.what.split(": ")
        if (entry_what_lst.length == 1) {
            entry_what_lst.push("")
        }
        if (entry.what == "title") {
            special_K.innerHTML += "<i>changed summary</i>";
            special_K.innerHTML += "<br>";
        } else if (entry.what == "description") {
            special_K.innerHTML += "<i>changed description</i>";
            special_K.innerHTML += "<br>";
        } else if (entry.what == "bug" && entry.message.match(/^added subscriber/g)) {
            special_K.innerHTML += "<i>added subscriber: </i>" + entry.message.replace(/added subscriber /g,"");
            special_K.innerHTML += "<br>";
        } else if (entry.what == "bug" && entry.message.match(/^added attachment/g)) {
            // attachments already appear in the comments
            continue
        } else if (entry.what == "marked as duplicate") {
            special_K.innerHTML += "<i>marked as duplicate</i>";
            special_K.innerHTML += "<br>";
        } else if (entry.what == "who_made_private") {
            special_K.innerHTML += "<i>made public (was originally made private by: " + entry.old + ")</i>";
            special_K.innerHTML += "<br>";
        } else if (entry_what_lst[1] == "assignee") {
            special_K.innerHTML += "<i>changed assignee for " + entry_what_lst[0] + ":</i> ";
            special_K.innerHTML += entry.old + " --> " + entry.new
            special_K.innerHTML += "<br>";
        } else if (entry_what_lst[1] == "importance") {
            special_K.innerHTML += "<i>changed importance for " + entry_what_lst[0] + ":</i> ";
            special_K.innerHTML += entry.old + " --> " + entry.new
            special_K.innerHTML += "<br>";
        } else if (entry_what_lst[1] == "statusexplanation") {
            // this is a comment, and already appears
            continue
        } else if (entry_what_lst[1] == "status") {
            special_K.innerHTML += "<i>changed status for " + entry_what_lst[0] + ":</i> ";
            special_K.innerHTML += entry.old + " --> " + entry.new
            special_K.innerHTML += "<br>";
        } else if (entry_what_lst[1] == "bugtargetdisplayname") {
            special_K.innerHTML += "<i>changed package assignment:</i> ";
            special_K.innerHTML += entry.old + " --> " + entry.new
            special_K.innerHTML += "<br>";
        } else {
            GM_log("cannot show " + entry.date + "//" + entry.what);
            //~ special_K.innerHTML += "<b>" + entry.user + " --> "+ entry.message + "</b>";
            //~ special_K.innerHTML += "<br>";
        }
    }
    return special_K;
}

var DIFF_HOURS = 0;
function getTimeOffset(timezone) {
    x = new Date("Wed, 18 Oct 2000 13:00:00 " + timezone);
    y = new Date("Wed, 18 Oct 2000 13:00:00");
    if (x == "Invalid Date") {
        // unable to parse string
        GM_log("unable to parse timezone: " + timezone);
        switch (timezone) {
            case "CET": return 1
            case "CEST": return 2
            default: return DIFF_HOURS
        }
    }
    local = new Date();
    return -((x - y) / 3600000 + (local.getTimezoneOffset() / 60))
}
//~ alert("CET (+1): " + getTimeOffset("CET"));
//~ alert("CEST (+2): " + getTimeOffset("CEST"));
//~ alert("EST (-5): " + getTimeOffset("EST"));
//~ alert("UTC (0): " + getTimeOffset("UTC"));
//~ alert("booo (0): " + getTimeOffset("booo"));

function createDate(date) {
    d = new Date();
    diff = (d - date) / 3600000;
    if (diff < 24) {
        if (diff < 0) {
            diff = 0 - diff;
        }
        diff = Math.round(diff);
        if (diff == 1) {
            return diff + " hour ago"
        } else {
            return diff + " hours ago"
        }
    } else {
        year = date.getFullYear();
        month = date.getMonth() + 1;
        if (month < 10) {
            month = "0" + month
        }
        day = date.getDate();
        if (day < 10) {
            day = "0" + day;
        }
        return "on " + year + "-" + month + "-" + day
    }
}

function create_comment(elements) {
    var date = new Date(elements[0].date);
    var boardComment = document.createElement("div");
    boardComment.setAttribute("class", "boardComment ");
    var boardCommentDetails = document.createElement("div");
    boardCommentDetails.setAttribute("class", "boardCommentDetails");
    boardCommentDetails.innerHTML = "<a href='/~" + elements[0].user["nickname"] + "'><img width='14' height='14' src='/@@/person' alt=''/> " + elements[0].user["fullname"] +"</a> changed<span> " + createDate(date) + "</span>:";
    boardComment.appendChild(boardCommentDetails);
    var boardCommentBody = document.createElement("div");
    boardCommentBody.setAttribute("class", "boardCommentBody");
    var content = document.createElement("div");
    content.setAttribute("style","font-family: monospace;");

    var special_K = create_commentbody(elements);
    content.appendChild(special_K);

    boardCommentBody.appendChild(content);
    boardComment.appendChild(boardCommentBody);
    return boardComment;
}

function log_handler(xmldoc, args) {
    /* TODO
     *  * check for same date and user for entry block
     *  * support changes after last comment
     *  * content of box
     *  * EQ: group items
     */
    var entries = [];
    var text = xmldoc.responseText.replace(/\n/g," ");
    var i_start = text.indexOf('<table class="listing">');
    var i_end = text.indexOf('</table>', i_start);
    text = text.substring(i_start, i_end);
    var act_log = text.split("<tr>");
    for (var i = 2; i < act_log.length; i++) {
        var change = {};
        var v = act_log[i].split(/<\/?td>/g);
        var d = v[1].split(" ");
        var t = d[3].split(":");
        var date = new Date(Number(d[2]) + 2000, month.indexOf(d[1]), d[0], t[0], t[1]).getTime();
        //~ GM_log(date);
        change["date"] = date;
        var user = {};
        t = v[3].split('"');
        user["nickname"] = t[1].replace(/\/~/g,"");
        user["fullname"] = t[2].replace(/(>|<\/a>)/g,"");
        change["user"] = user;
        change["what"] = v[5];
        change["old"] = v[7] ? v[7] : "None";
        change["new"] = v[9] ? v[9] : "None";
        change["message"] = v[11];
        if (change["what"] == "bug" && change["message"] == "added bug") {
            /** ignore 'added bug' but use it to calculate the timedifferenz caused by timezones**/
            d = date - DATEREPORTED;
            DIFF_HOURS = d / 3600000;
            //~ alert(date + " || " + DATEREPORTED);
            //~ alert((d / 3600000) + " >>> " + DIFF_HOURS);
            continue;
        }
        //~ GM_log("-->" + change.date + "//" + change.what);
        entries.push(change);
    }
    var description = args[0];
    var comments = args[1];

    /** ignore 'added bug' **/
    /**
    var special_K = document.createElement("p");
    var x = entries.shift();
    special_K.innerHTML = "<b>" + x.user + " --> "+ x.message + "</b>";
    description.parentNode.insertBefore(special_K, description);
    **/

    cur = entries.shift();
    var all_comments = xpath("div[@class='boardCommentBody']", comments.snapshotItem(i)).snapshotItem(0);
    for (var i = 0; i < comments.snapshotLength; i++) {
        var d = xpath("div[@class='boardCommentDetails']/span", comments.snapshotItem(i));
        var desc_body = xpath("div[@class='boardCommentBody']/div", comments.snapshotItem(i)).snapshotItem(0);
        d = d.snapshotItem(0).title.split(" ");
        var date = d[0].split("-");
        var time = d[1].split(":");
        var diff = getTimeOffset(d[2]);
        var x = new Date(date[0], date[1] -1, date[2], Number(time[0]) - diff, time[1]).getTime();
        if (debug) {
            GM_log("diff: " + diff + "||" + d[2]);
            GM_log("date_tuple: " + [date[0], date[1] -1, date[2], Number(time[0]) + Number(diff), time[1]]);
            comment_date = new Date(x);
            activity_date = new Date(cur.date);
            GM_log("date values: " + comment_date + " || " + activity_date);
        }
        if (cur.date < x){
            //~ GM_log("less");
            var tmp_array = new Array();
            while (cur.date < x) {
                tmp_array.push(cur);
                cur = entries.shift();
                if (!cur) {
                    break;
                }
            }
            var boardComment = create_comment(tmp_array);
            comments.snapshotItem(i).parentNode.insertBefore(boardComment, comments.snapshotItem(i));
        } else if (cur.date == x) {
            //~ GM_log("EQ");
            var tmp_array = new Array();
            while (cur.date == x) {
                tmp_array.push(cur);
                cur = entries.shift();
                if (!cur) {
                    break;
                }
            }
            var special_K = create_commentbody(tmp_array);
            var p = xpath("p", desc_body).snapshotItem(0);
            if (p) {
                p.parentNode.insertBefore(special_K, p);
            }else{
                desc_body.appendChild(special_K);
            }
        }
    }
    var tmp_array = new Array();
    var eof_comments = comments.snapshotItem(comments.snapshotLength - 1);
    //~ alert(eof_comments);
    eof_comments = eof_comments ? eof_comments.nextSibling : description.parentNode.nextSibling;
    //~ alert(eof_comments);
    if (cur) {
        while (entries) {
            x = cur.date;
            while (cur.date == x) {
                tmp_array.push(cur);
                cur = entries.shift();
                if (!cur) {
                    break;
                }
            }
            var boardComment = create_comment(tmp_array);
            eof_comments.parentNode.insertBefore(boardComment, eof_comments);
            eof_comments = boardComment;
            if (!cur) {
                break;
            }
        }
    }
}

var DATEREPORTED;

window.addEventListener("load", function(e) {
//    GM_log('script running');
    var activity_url = xpath("//a[@class='menu-link-activitylog']").snapshotItem(0);
    var description = xpath("//div[@id='bug-description']/p").snapshotItem(0);
    var comments = xpath("//div[@class='boardComment']");
    var args = [description, comments];
    var d = xpath("//*[@class='object timestamp']/span").snapshotItem(0);
    d = d.title.split(" ");
    date = d[0].split("-");
    time = d[1].split(":");
    //~ alert(date);
    //~ alert(time);
    DATEREPORTED = new Date(date[0], date[1] - 1, date[2], time[0], time[1]).getTime();
    //~ alert(DATEREPORTED);
    loadData(activity_url, log_handler, args);
}, false);

})(); // end anonymous function wrapper
