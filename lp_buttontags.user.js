// ==UserScript==
// @name           LP_ButtonTags
// @namespace      http://bryceharrington.org/greasemonkey/
// @description    (Launchpad) Buttons for adding tags
// @include        https://bugs.launchpad.net/*/+bug/*
// @include        https://bugs.staging.launchpad.net/*/+bug/*
// ==/UserScript==

// Feature Wishlist:
//   * Clean up the code (needs some functions broken out)
//   * Select tags from the N most popular for the project
//   * Display error messages in-page instead of with alerts()
//   * Use onreadystatechange() to show the processing progress
//   * Don't display 'Add tag' unless there are actually tags to be added
//   * Some sort of mechanism to delete tags

var LPS = unsafeWindow.LPS;
var LP = unsafeWindow.LP;

(function () {
  var SCRIPT = {
    name: "LP_ButtonTags",
    namespace: "http://bryceharrington.org/greasemonkey/",
    description: '(Launchpad) Buttons for adding tags',
    source: "http://bryceharrington.org/greasemonkey/",
    identifier: "http://bryceharrington.org/greasemonkey/lp_buttontags.user.js",
    version: "0.9.1",
    date: (new Date(2011, 9 - 14, 29))// update date
    .valueOf()
  };

var debug = 0;

var tags = new Object;

var tagFields = new Array(
                            "name",       // required -- name of the tag to use
                            "tip",        // required -- the tooltip to show on mouse over
                            "project",    // required -- the project the tag should be displayed for 
                            "package"     // required -- the package the tag should be displayed for
                          );

// uses Launchpad javascript client to add data to bug tags
function post(data) {
    var lp_client = new LPS.lp.client.Launchpad();
    var bug = new LPS.lp.client.Entry(lp_client, LP.cache.bug, LP.cache.bug.self_link);
    bug.set('tags', data);
    bug.lp_save({on:{success:
        window.setTimeout(function() { window.location.reload() }, 3000)
        }});
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

// grab the standard tags used from an xml file
function loadStandardTags() {
    if (debug) {
        alert("loadStandardTags");
    }
    GM_xmlhttpRequest
        (
          {
            method: 'GET',
            url:    'http://people.ubuntu.com/~brian/greasemonkey/bugsquad-tags.xml',
            headers: {
                'Accept': 'application/atom+xml,application/xml,text/xml',
            },
            onload:  function(results) {
                if (debug) {
                    alert("loadStandardTags onload start");
                }
                var parser = new DOMParser();
                var dom = parser.parseFromString(results.responseText,"application/xml");
                var definedTags = dom.getElementsByTagName('tag');
                /* if we actually have some replies, clear the old ones */
                if (definedTags.length > 0) {
                    tags.count = 0;
                }
                var base = 0;
                for (var i=0; i < definedTags.length; i++) {
                    for (var field in tagFields) {
                        var fieldname = tagFields[field];
                        //tags[fieldname] = new Array;
                        var text = definedTags[i].getElementsByTagName(fieldname)[0].textContent;
                        tags[fieldname][base+i] = text;
                    }
                }
                tags.count += definedTags.length
                // reload again in 1.5 days
                var time = new Date();
                tags.reloadAt = time.getUTCMilliseconds() + (1000 * 60 * 60 * 36);
                savePreferences();
                // run through the magical display tags function again
                displayTags();
                if (debug) {
                    alert("loadStandardTags onload end");
                }
            }
          }
        )
}

function loadPreferences()
{
    if (debug) {
        alert("loadPreferences start");
    }
    tags.standardSeen = false;
    tags.count = parseInt(GM_getValue('buttontags.count', 0));
    for (var field in tagFields) {
        var fieldname = tagFields[field];
        tags[fieldname] = new Array;

        for (var idx = 0; idx < tags.count; idx ++) {
            tags[fieldname][idx] = GM_getValue('buttontags.' + fieldname+idx,"");
        }
    }
    tags.reloadAt = parseInt(GM_getValue('buttontags.reload-at', 0));
    if (debug) {
        alert("loadPreferences finish");
    }
}

function savePreferences()
{
    if (debug) {
        alert("savePreferences start");
    }
    // save the count
    GM_setValue('buttontags.count', ''+tags.count);
    // save standard-reply-reload date
    GM_setValue('buttontags.reload-at', ''+tags.reloadAt);

    // save the preferences
    for (var idx = 0; idx < tags.count; idx ++) {
        for (var field in tagFields) {
            //alert("Saving "+tagFields[field]+idx);
            GM_setValue('buttontags.' + tagFields[field]+idx, tags[tagFields[field]][idx]);
        }
    }

    if (debug) {
        alert("savePreferences end");
    }
}

function displayTags()
{
    if (debug) {
        alert("displayTags start");
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

    var gmtags = document.getElementById('gm-tags');
    if (gmtags) {
        gmtags.parentNode.removeChild(gmtags);
    }

    var tag_section = document.createElement("div");
    tag_section.setAttribute('style', "text-align: left; margin-bottom: 1em;");
    tag_section.setAttribute('id', "gm-tags");
    
    var innerTextElement = document.createTextNode("Add tag: ");
    tag_section.appendChild(innerTextElement);
    
    // grab the part after bugs.launchpad.net - pathname looks like /ubuntu/+source/pkgname/+bug/1
    var pathname = window.location.pathname;
    // find the project name
    var project_name = pathname.split('/')[1]
    // find the source package name
    var package_name = pathname.split('/')[3]

    tags:
    for (var idx = 0; idx < tags.count; idx++) {
    	// Skip if tag is already listed
    	for (var current_tag in tags_current_list) {
                    if (tags_current_list[current_tag] == tags["name"][idx]) {
    			continue tags;
    		}
    	}
    
            // Skip if tag is not part of the project
            if ( tags["project"][idx] != project_name ) {
                continue tags;
                
            }
    
            // if the project is ubuntu check the package name that the tag applies to
            if ( project_name == 'ubuntu' ) {
                // Skip if tag isn't for this package or for the catch-all any package
                if ( (tags["package"][idx] != pathname.split('/')[3]) && (tags["package"][idx] != 'any') ) {
                    continue tags;
                }
            }
    
    	var tag_button = document.createElement("a");
    	tag_button.href = "#" + tags["name"][idx];
    	tag_button.id = tags["name"][idx];
    	tag_button.title = tags["tip"][idx];
    	tag_button.innerHTML = " " + tags["name"][idx] + " ";
    	tag_button.addEventListener('click', function(event) {
    		event.preventDefault();
      		//event.stopPropagation(); // not sure if this is needed

		if (!GM_xmlhttpRequest) {
			alert('This functionality requires a newer version of Greasemonkey - please upgrade!');
			return;
		}

		tags_current_list[tags_current_list.length] = this.id;
                post(tags_current_list);
                // don't reload right away because the tag update post needs to finish
                //window.setTimeout(function() { window.location.reload() }, 1200);

	}, false);

	tag_section.appendChild(tag_button);
    }
    // adding in a reload button
    var reload_button = document.createElement("a");
    reload_button.href = "#[+reload+]";
    reload_button.id = "[+reload+]";
    reload_button.innerHTML = " [+reload+] ";
    reload_button.addEventListener('click', function(event) { event.preventDefault(); loadStandardTags(); alert('Tags Loaded'); return false;}, false);

    tag_section.appendChild(reload_button);

    // 2009-07-02 add the tag_section before the existing tags but after the bug description
    // ideally they'd go after the existing tags and "Update description / tags" link
    // however those div's and "Link a related branch" have no id

    var bug_tags = document.getElementById('bug-tags');
    if (bug_tags) {
        bug_tags.parentNode.insertBefore(tag_section, bug_tags);
    }
    if (debug) {
        alert("displayTags end");
    }
}

window.addEventListener("load", function(e) {

	loadPreferences();
	// load tags if not already in the preferences, or
	// if the "reloadAt" preference has expired
	var time = new Date();

	if (time.getUTCMilliseconds() > tags.reloadAt) {
	    loadStandardTags();
	}
	else {
	    displayTags();
	} 

}, false);    

})();
