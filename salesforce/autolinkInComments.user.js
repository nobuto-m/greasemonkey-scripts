// ==UserScript==
// @name        Salesforce - Autolink in comments
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/autolinkInComments.user.js
// @match       https://eu1.salesforce.com/*
// @version     1.2
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require     https://github.com/nobuto-m/greasemonkey-scripts/raw/master/libs/autolink-js/autolink.js
// ==/UserScript==

var comments = $('div[id$=\'_RelatedCommentsList_body\']').find('td.dataCell');

$(comments).each(function () {
  var comment = $(this);
  var content = comment.html();
  comment.html(content.autoLink({ target: "_blank" }));
});
