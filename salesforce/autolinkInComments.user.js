// ==UserScript==
// @name        Salesforce - Autolink in comments
// @description Discover links in comments
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/autolinkInComments.user.js
// @match       https://*.salesforce.com/*
// @version     1.8
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @require     https://raw.githubusercontent.com/nfrasser/linkify-shim/67ecf680a10e3ed029e4bfd62e8217e27326a6ae/linkify.min.js
// @require     https://raw.githubusercontent.com/nfrasser/linkify-shim/67ecf680a10e3ed029e4bfd62e8217e27326a6ae/linkify-string.min.js
// @require     https://raw.githubusercontent.com/nfrasser/linkify-shim/67ecf680a10e3ed029e4bfd62e8217e27326a6ae/linkify-jquery.min.js
// ==/UserScript==

var comments = $('div[id$=\'_RelatedCommentsList_body\']').find('td.dataCell');
$(comments).linkify();
