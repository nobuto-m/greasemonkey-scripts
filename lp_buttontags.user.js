// ==UserScript==
// @name           LP_ButtonTags
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) Buttons for adding tags
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// ==/UserScript==

// ------  User settable data  -------------

// List of tags to display in the UI
var tags = new Object;
tags = [
	{"tag":"ooo-calc", "tip":"Happens with spreadsheet"},
	{"tag":"ooo-writer", "tip":"Happens with word processor"},
        {"tag":"ooo-impress", "tip":"Happens with presentation"},
        {"tag":"ooo-base", "tip":"Happens with database"},
        {"tag":"likely-dup", "tip":"Probably a duplicate"},
        {"tag":"needs-devrelease-testing", "tip":"Needs testing in the development release"}
];

// ------- End of User settable data -------

// Feature Wishlist:
//   * Clean up the code (needs some functions broken out)
//   * Reliable way for users to add new tags, rather than editing the code above
//   * project-specific tag lists, so we use one set of tags for ubuntu, another for inkscape, etc.
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
var tags_current = document.getElementById('bug-tags');
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
tag_section.setAttribute('style', "text-align: left; margin-bottom: 1em;");

var innerTextFormat = document.createElement("b");
var innerTextElement = document.createTextNode("Add tag: ");
innerTextFormat.appendChild(innerTextElement);
tag_section.appendChild(innerTextFormat);

tags:
for (var tag in tags) {
	// Skip if tag is already listed
	for (var current_tag in tags_current_list) {
		if (tags_current_list[current_tag] == tags[tag]["tag"]) {
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
		var tags_new = tags_current_list.join("+");

		// Get the bug's title and description
		var bug_title = document.getElementsByTagName('h1')[0].innerHTML;
		var bug_description;
		get(document.location + "/+edit", function(responseText) {
			//alert("Received responseText");
			var xmlobject = (new DOMParser()).parseFromString(responseText, "text/xml");
			bug_description = xmlobject.getElementById('field.description').textContent;

			//alert("Desc: " + bug_description);

			if (! bug_description || bug_description == "undefined") {
				alert("Error:  No bug description defined");
				return;
			}

//    data: encodeURIComponent(data),
//    data: encodeURI(data),
			var form_tag_data = 'field.actions.change=Change&' + 
				'field.tags=' + encodeURI(tags_new) + '&' +
				'field.title=' + encodeURIComponent(bug_title) + '&' +
				'field.description=' + encodeURIComponent(bug_description) + '&' +
				'field.actions.confirm_tag=' + encodeURIComponent("Yes, define new tag");

			// alert("Data: " + form_tag_data);

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


