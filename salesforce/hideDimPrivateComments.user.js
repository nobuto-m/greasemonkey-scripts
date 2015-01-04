// ==UserScript==
// @name        Salesforce - Hide/Dim private comments
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/salesforce
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/salesforce/hideDimPrivateComments.user.js
// @include     https://eu1.salesforce.com/*
// @version     2.2
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require     https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js
// ==/UserScript==

// TODO: handle dymamic status change of public/private

// default
var defaultHide = false;
var defaultDim = false;

// color
var dimGray = '#AEA79F'; // Ubuntu warm gray

// button titles
var buttonTitleHide = '(gm) Hide private comments';
var buttonTitleShow = '(gm) Show private comments';
var buttonTitleDim = '(gm) Dim private comments';
var buttonTitleBrighten = '(gm) Brighten private comments';

// get the title element "Case Comments" and put 2 buttons there
var commentsListTitleElement = $('h3[id$=\'_RelatedCommentsList_title\']');
$(commentsListTitleElement).css('margin', '5px 0');
$(commentsListTitleElement).after(
  '<input value="' + buttonTitleHide + '" id="gm_hide_private_comments" class="btn gm_button" type="button">',
  '<input value="' + buttonTitleDim + '" id="gm_dim_private_comments" class="btn gm_button" type="button">'
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
  $('#gm_dim_private_comments').toggle();
  if ($('#gm_hide_private_comments').attr('value') === buttonTitleHide) {
    $('#gm_hide_private_comments').attr('value', buttonTitleShow);
  }
  else {
    $('#gm_hide_private_comments').attr('value', buttonTitleHide);
  }
}

function dim_toggle_comments() {
  if ($('#gm_dim_private_comments').attr('value') === buttonTitleDim) {
    $(commentsPrivate).each(function () {
      $(this).animate({
        backgroundColor: dimGray
      }, 'fast');
    });
    $('#gm_dim_private_comments').attr('value', buttonTitleBrighten);
  }
  else {
    $(commentsPrivate).each(function () {
      $(this).animate({
        backgroundColor: 'transparent'
      }, 'fast');
    });
    $('#gm_dim_private_comments').attr('value', buttonTitleDim);
  }
}

// set button action
$('#gm_hide_private_comments').click(function () {
  hide_toggle_comments();
});
$('#gm_dim_private_comments').click(function () {
  dim_toggle_comments();
});

// set default status
if (defaultHide) {
  hide_toggle_comments();
}
if (defaultDim) {
  dim_toggle_comments();
}
