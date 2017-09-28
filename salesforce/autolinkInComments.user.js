// ==UserScript==
// @name        Salesforce - Autolink in comments
// @description Discover links in comments
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/autolinkInComments.user.js
// @match       https://*.salesforce.com/*
// @version     1.7
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js
// @require     https://raw.githubusercontent.com/nobuto-m/greasemonkey-scripts/master/libs/linkify-shim/linkify.min.js
// @require     https://raw.githubusercontent.com/nobuto-m/greasemonkey-scripts/master/libs/linkify-shim/linkify-string.min.js
// @require     https://raw.githubusercontent.com/nobuto-m/greasemonkey-scripts/master/libs/linkify-shim/linkify-jquery.min.js
// ==/UserScript==

var comments = $('div[id$=\'_RelatedCommentsList_body\']').find('td.dataCell');
$(comments).linkify();
