// ==UserScript==
// @name           LP_Highlight_Me
// @namespace      https://launchpad.net/launchpad-gm-scripts
// @description    Highlight the logged in user in various listings.
// @include        https://launchpad.net/*/+milestone/*
// @include        https://*.launchpad.net/*/+milestone/*
// @include        https://*.edge.launchpad.net/*/+milestone/*
// @version        0.1.2
// @date           2008-01-25
// @creator        Gavin Panella <gavin@gromper.net>
// ==/UserScript==
//
// Features:
//
//   1. Highlight rows on milestone pages that contain the logged-in
//   users name.
//


function addGlobalStyle(css) {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }
}

function findParent(element, tagName) {
    // Find a parent element matching tagName, which should probably
    // be all capitals.
    var parent = element.parentNode;
    return (parent == null || parent.tagName == tagName) ?
        parent : arguments.callee(parent, tagName);
}

function getLoggedInUserLink() {
    // Returns the lp username of the logged-in user.
    var forms = document.getElementsByTagName('form');
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        if (form.action.match(/[/][+]logout$/)) {
            href = form.getElementsByTagName('a')[0].href;
            if (debug) {
                GM_log("User href: "+href);
            }
            return href.split('~')[1];
        }
    }
}

function highlightMilestoneRows() {
    // Highlight rows for specs and bugs that are assigned to the
    // logged-in user.
    var user = getLoggedInUserLink();
    if (debug) {
        GM_log("User: "+user);
    }
    if (user == null) {
        return;
    }

    addGlobalStyle(
        'tr.highlight-for-user td { background-color: #ffcc56; }');

    var highlight = function(table) {
        if (table == null) return;
        var links = table.getElementsByTagName('a');
        var count = 0;
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var link_user = link.href.split('~')[1];
            //if (debug) {
            //    GM_log("Link found: "+link);
            //}
            if ( String(link_user) == String(user) ) {
                if (debug) {
                    GM_log("Found a match!")
                }
                var row = findParent(link, 'TR');
                if (row) {
                    if (row.className) {
                        row.className += ' highlight-for-user';
                    }
                    else {
                        row.className = 'highlight-for-user';
                    }
                    count += 1;
                }
            }
        }
        return count;
    };

    var spec_count = highlight(document.getElementById('milestone_specs'));
    var spec_header = document.getElementById("specification-count");
    spec_header.innerHTML += ' - ' + spec_count + ' assigned to you';

    var bug_count = highlight(document.getElementById('milestone_bugtasks'));
    var bug_header = document.getElementById("bug-count");
    bug_header.innerHTML += ' - ' + bug_count + ' assigned to you';
}

var debug = 0;

var location = document.location.href;

if (location.indexOf('/+milestone/') >= 0) {
    // Milestone page
    highlightMilestoneRows();
}




// End
