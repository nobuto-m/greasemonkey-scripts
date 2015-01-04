// ==UserScript==
// @name        Salesforce - Autolink in comments
// @description Make http/https text in comments clickable
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/autolinkInComments.user.js
// @match       https://eu1.salesforce.com/*
// @version     1.4
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require     https://github.com/nobuto-m/greasemonkey-scripts/raw/master/libs/jQuery-linkify/dist/jquery.linkify.min.js
// ==/UserScript==

var comments = $('div[id$=\'_RelatedCommentsList_body\']').find('td.dataCell');
$(comments).linkify();
