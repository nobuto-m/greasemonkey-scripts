// ==UserScript==
// @name        Salesforce - Hide private comments
// @description Add buttons to hide private comments
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/hidePrivateComments.user.js
// @match       https://eu1.salesforce.com/*
// @version     2.5
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// ==/UserScript==

// default
var defaultHide = false;

// button titles
var buttonTitleHide = '(gm) Hide private comments';
var buttonTitleShow = '(gm) Show private comments';

// get the title element "Case Comments" and put a button there
var commentsListTitleElement = $('h3[id$=\'_RelatedCommentsList_title\']');
$(commentsListTitleElement).css('margin', '5px 0');
$(commentsListTitleElement).after(
  '<input value="' + buttonTitleHide + '" id="gm_hide_private_comments" class="btn gm_button" type="button">',
);
$('.gm_button').css({
  'margin': '3px',
  'font-size': '100%'
});

// get private comments list
var comments = $('div[id$=\'_RelatedCommentsList_body\']').find('tr.dataRow');
var commentsPrivate = [];
$(comments).each(function () {
  if ($(this).find('.checkImg').attr('src') === '/img/checkbox_unchecked.gif') {
    commentsPrivate.push($(this));
  }
});

function hide_toggle_comments() {
  $(commentsPrivate).each(function () {
    $(this).toggle('fast');
  });
  if ($('#gm_hide_private_comments').attr('value') === buttonTitleHide) {
    $('#gm_hide_private_comments').attr('value', buttonTitleShow);
  }
  else {
    $('#gm_hide_private_comments').attr('value', buttonTitleHide);
  }
}

// set button action
$('#gm_hide_private_comments').click(function () {
  hide_toggle_comments();
});

// set default status
if (defaultHide) {
  hide_toggle_comments();
}
