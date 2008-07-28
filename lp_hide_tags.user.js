// ==UserScript==
// @name           LP_HideTags
// @namespace      http://thekorn.com/greasemonkey/
// @description    (Launchpad) hide and sort tags
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-07-21
// @creator        Markus Korn <thekorn@gmx.de>
// ==/UserScript==


(function() {

// threshold: min. number of tag appearances for a project
var threshold = 10;
// max_tags: max. number of shown tags, if this is -1 all tags fitting the threshold criteria will be shown
var max_tags = 15;
// min_tags: if the number of tags for a project is smaller than this show a sorted list of all tags
var min_tags = 30;
// whitelist: always show tags in this list, ignore other setting for these tags
var whitelist = ["bitesize"];
// blacklist: do not show tags in this list
var blacklist = ["apport-crash", "apport-bug"];
// ------- End of User settable data -------

function xpath(query, context) {
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function sort_tags(a, b) {
    return b["count"] - a["count"];
}

function in_list(value, mylist) {
    for (s in mylist) {
        if (mylist[s] == value) {
            return true;
        }
    }
    return false;    
}

window.addEventListener("load", function(e) {

    var tags = [];
    var whitelist_tags = [];
    var tag_nodes = xpath("//div[@class='portlet' and @id='portlet-tags']/div[@class='portletBody']/table//tr");
    for ( var i = 0; i < tag_nodes.snapshotLength; i++ ) {
        var tag = {};
        var node = tag_nodes.snapshotItem(i);
        var m = xpath("td[2]", node);
        tag["count"] = m.snapshotItem(0).textContent;
        tag["node"] = node;
        m = xpath("td[1]/a", node);
        name = m.snapshotItem(0).textContent;
        if (in_list(name, blacklist)) {
            //Nothing
        } else if (in_list(name, whitelist)) {
            whitelist_tags.push(tag);
        } else if (!(tag_nodes.snapshotLength > min_tags && tag["count"] < threshold)) {
            tags.push(tag);
        }
        node.parentNode.removeChild(node);
    }
    tags = tags.sort(sort_tags);
    if (max_tags != -1) {
        tags = tags.slice(0, max_tags);
    }
    tags = tags.concat(whitelist_tags);
    tags = tags.sort(sort_tags);
    var tag_node = xpath("//div[@class='portlet' and @id='portlet-tags']/div[@class='portletBody']/table").snapshotItem(0);
    for ( var i = 0; i < tags.length; i++) {
        tag_node.appendChild(tags[i]["node"]);
    }
  }, false);
})(); 
