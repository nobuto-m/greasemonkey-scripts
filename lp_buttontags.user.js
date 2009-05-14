// ==UserScript==
// @name           LP_ButtonTags
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) Buttons for adding tags
// @include        https://bugs.launchpad.net/*
// @include        https://bugs.edge.launchpad.net/*
// @include        https://bugs.staging.launchpad.net/*
// ==/UserScript==

// ------  User settable data  -------------

// List of tags to display in the UI
var tags = new Object;
tags = [
        // --- Ubuntu Section ---
        // ubuntu template
        // {"tag":'', tip:"", "project":"ubuntu", "package":""},
        //
        // any package - source https://wiki.ubuntu.com/Bugs/Tags
        {"tag":'a11y', tip:"An accessibility problem", "project":"ubuntu", "package":"any"},
        {"tag":'bitesize', tip:"Probably an easy fix, appropriate for new developers", "project":"ubuntu", "package":"any"},
        {"tag":'hw-specifc', tip:"Requires specfic hardware to recreate", "project":"ubuntu", "package":"any"},
        {"tag":'likely-dup', tip:"Sounds like a dupe of an existing bug; needs further investigation", "project":"ubuntu", "package":"any"},
        {"tag":'metabug', tip:"High probability of duplicate reports", "project":"ubuntu", "package":"any"},
        {"tag":'needs-packaging', tip:"A request for software to be packaged", "project":"ubuntu", "package":"any"},
        {"tag":'notifications', tip:"Related to Jaunty+ notification system", "project":"ubuntu", "package":"any"},       
        {"tag":'packaging', tip:"Strictly a packaging issue", "project":"ubuntu", "package":"any"},
        {"tag":'regression-potential', tip:"Bug in devel release and not stable", "project":"ubuntu", "package":"any"},
        {"tag":'regression-release', tip:"Bug in stable release and not previous stable release", "project":"ubuntu", "package":"any"},
        {"tag":'screencast', tip:"Screencast of the bug is attached", "project":"ubuntu", "package":"any"},
        {"tag":'string-fix', tip:"For spelling and grammatic errors", "project":"ubuntu", "package":"any"},
        {"tag":'usability', tip:"A usability issue with the application", "project":"ubuntu", "package":"any"},
        // package openoffice - source https://wiki.ubuntu.com/DebuggingOpenOffice
        {"tag":'ooo-base', tip:"Bug report about database program", "project":"ubuntu", "package":"openoffice"},
        {"tag":'ooo-calc', tip:"Bug report about spreadsheet application", "project":"ubuntu", "package":"openoffice"},
        {"tag":'ooo-impress', tip:"Bug report about presentation application", "project":"ubuntu", "package":"openoffice"},
	{"tag":"ooo-writer", tip:"Bug report about word processor", "project":"ubuntu", "package":"openoffice"},
        // package update-manager - source https://wiki.ubuntu.com/DebuggingUpdateManager
	{"tag":"cdrom-upgrade", tip:"Related to an upgrade from CD-ROM or DVD media", "project":"ubuntu", "package":"update-manager"},
        {"tag":'dapper2hardy', tip:"Related to an upgrade from Dapper to Hardy", "project":"ubuntu", "package":"update-manager"},
        {"tag":'edgy2feisty', tip:"Related to an upgrade from Edgy to Feisty", "project":"ubuntu", "package":"update-manager"},
        {"tag":'feisty2gutsy', tip:"Related to an upgrade from Feisty to Gutsy", "project":"ubuntu", "package":"update-manager"},
        {"tag":'gutsy2hardy', tip:"Related to an upgrade from Gutsy to Hardy", "project":"ubuntu", "package":"update-manager"},
        {"tag":'hardy2intrepid', tip:"Related to an upgrade from Hardy to Intrepid", "project":"ubuntu", "package":"update-manager"},
        {"tag":'intrepid2jaunty', tip:"Related to an upgrade from Intrepid to Jaunty", "project":"ubuntu", "package":"update-manager"},
        // package linux - source https://wiki.ubuntu.com/Bugs/Tags 
        // it'd be neat if they applied to other kernel packages too...
	{"tag":"cherry-pick", tip:"Has a git commit SHA from upstream", "project":"ubuntu", "package":"linux"},
        {"tag":"kernel-bug", tip:"BUG: message appears in logs", "project":"ubuntu", "package":"linux"},
        {"tag":"kernel-oops", tip:"Causes a kernel Oops", "project":"ubuntu", "package":"linux"},
        // package network-manager - source https://wiki.ubuntu.com/DebuggingNetworkManager
        {"tag":"driver-madwifi", tip:" The madwifi driver is in use", "project":"ubuntu", "package":"network-manager"},
        {"tag":"driver-ndiswrapper", tip:" The ndiswrapper driver is in use", "project":"ubuntu", "package":"network-manager"},
        {"tag":"encryption-wep", tip:" WEP encryption is used", "project":"ubuntu", "package":"network-manager"},
        {"tag":"encryption-wpa", tip:" WPA encryption is used", "project":"ubuntu", "package":"network-manager"},
        {"tag":"encryption-wpa2", tip:" WPA2 encryption is used", "project":"ubuntu", "package":"network-manager"},
        {"tag":"vpn", tip:"Related to either openvpn, vpnc or pptp network-manager vpn modules", "project":"ubuntu", "package":"network-manager"},

        // --- Projects Section ---
        // project template
        // {"tag":'', tip:"", "project":""},
        //
        // project - malone source https://dev.launchpad.net/LaunchpadBugTags
        {"tag":"api", tip:"Related to any machine readable output", "project":"malone"},
        {"tag":"bugwatch", tip:"Related to bug watches", "project":"malone"}
];

// ------- End of User settable data -------

// Feature Wishlist:
//   * Clean up the code (needs some functions broken out)
//   * Reliable way for users to add new tags, rather than editing the code above
//   * Select tags from the N most popular for the project
//   * Display error messages in-page instead of with alerts()
//   * Use onreadystatechange() to show the processing progress
//   * Don't display 'Add tag' unless there are actually tags to be added
//   * Some sort of mechanism to delete tags
//   * Having to pull the description from the +edit page makes the process
//     rather slow.  However, the description in the main bug page is full
//     of HTML markup tags.  Perhaps it could be parsed to remove the markup
//     so that it's equivalent to what would have been in +edit's textarea?

// Sends data to url using HTTP POST, then calls the function cb with the response text as its single argument.
function post(url, data, cb) {
  GM_xmlhttpRequest({
    method: "POST",
    url: url,
    headers: {'Content-type':'application/x-www-form-urlencoded'},
//    data: encodeURIComponent(data),
//    data: encodeURI(data),
    data: data,
    onload: function(xhr) { cb(xhr.responseText); },
    onerror: function(responseDetails) {
	alert('Failed to set tags ' + responseDetails.status +
		' ' + responseDetails.statusText + '\n\n');
    },
    // onreadystatechange: function(responseDetails) { },
  });
}

// Retrieves url using HTTP GET, then calls the function cb with the response text as its single argument.
function get(url, cb) {
  GM_xmlhttpRequest({
    method: "GET",
     url: url,
     headers: {
        'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
        'Accept': 'text/xhtml,application/xml,text/html',
     },
     onload: function(xhr) { 
	if (xhr.status != 200) {
		alert("Failed to retrieve " + url + "\n" + xhr.statusText);
		return -1;
	}
	cb(xhr.responseText);
     },
     onerror: function(xhr) {
	alert('Failed get url ' + url + '\n' + responseDetails.status +
		' ' + responseDetails.statusText + '\n\n');
     }
  });
}

// Does document already have list of Tags?  If so, snag them.
var tags_current = document.getElementById('tag-list');
var tags_current_list = new Array();
if (tags_current) {
	var tags_current_anchors = tags_current.getElementsByTagName("a");
	// Extract text from child <a> tags and put into an array
	for (var i = 0; i < tags_current_anchors.length; i++) {
		tags_current_list[tags_current_list.length] = tags_current_anchors[i].innerHTML;
	}
	//alert(tags_current_list.join(" "));
}

var tag_section = document.createElement("div");
tag_section.setAttribute('style', "text-align: right; margin-bottom: 1em;");

var innerTextElement = document.createTextNode("Add tag: ");
tag_section.appendChild(innerTextElement);

// grab the part after bugs.launchpad.net - pathname looks like /ubuntu/+source/pkgname/+bug/1
var pathname = window.location.pathname;
// find the project name
var project_name = pathname.split('/')[1]
// find the source package name
var package_name = pathname.split('/')[3]

tags:
for (var tag in tags) {
	// Skip if tag is already listed
	for (var current_tag in tags_current_list) {
		if (tags_current_list[current_tag] == tags[tag]["tag"]) {
			continue tags;
		}
	}

        // Skip if tag is not part of the project
        if ( tags[tag]["project"] != project_name ) {
            continue tags;
        }

        // if the project is ubuntu check the package name that the tag applies to
        if ( project_name == 'ubuntu' ) {
            // Skip if tag isn't for this package or for the catch-all any package
            if ( (tags[tag]["package"] != pathname.split('/')[3]) && (tags[tag]["package"] != 'any') ) {
                continue tags;
            }
        }

	var tag_button = document.createElement("a");
	tag_button.href = "#" + tags[tag]["tag"];
	tag_button.id = tags[tag]["tag"];
	tag_button.title = tags[tag]["tip"];
	tag_button.innerHTML = " " + tags[tag]["tag"] + " ";
	tag_button.addEventListener('click', function(event) {
		event.preventDefault();
//		event.stopPropagation(); // not sure if this is needed

		if (!GM_xmlhttpRequest) {
			alert('This functionality requires a newer version of Greasemonkey - please upgrade!');
			return;
		}

		tags_current_list[tags_current_list.length] = this.id;
		var tags_new = tags_current_list.join(" ");

		get(document.location + "/+edit", function(responseText) {
			//alert("Received responseText");

		    // Get the old details
			var xmlobject = (new DOMParser()).parseFromString(responseText, "text/xml");

			var bug_description = xmlobject.getElementById('field.description').textContent;
			var bug_nickname = xmlobject.getElementById('field.name').value;
			var bug_title = xmlobject.getElementById('field.title').value;

			if (! bug_description || bug_description == "undefined") {
				alert("Error:  No bug description defined");
				return;
			}

			var form_tag_data = 'field.actions.change=Change&' +
				'field.name=' + encodeURIComponent(bug_nickname) + '&' +
				'field.tags=' + encodeURIComponent(tags_new) + '&' +
				'field.title=' + encodeURIComponent(bug_title) + '&' +
				'field.description=' + encodeURIComponent(bug_description) + '&' +
				'field.actions.confirm_tag=' + encodeURIComponent("Yes, define new tag");

			//alert("Data: " + form_tag_data);

			post(document.location + "/+edit", form_tag_data, function(responseText) {
				// TODO:  Need better parsing of error messages in output
				// for debugging errors:
				//var outputElement = document.createElement('div');
				//outputElement.innerHTML = responseText;
				//document.body.appendChild(outputElement);
				if (responseText.length > 6) {
					//alert("Saved tags: " + tags_new );
					// Either reload the page, or append tags to the Tags: list
					window.location.reload()
				} else {
					alert("Failed to save tags " + tags_new);
				}
			});

		});

	}, false);

	tag_section.appendChild(tag_button);
}

var bug_desc = document.getElementById('bug-description');

bug_desc.parentNode.insertBefore(tag_section, bug_desc);

//alert(tag_section.innerHTML);


