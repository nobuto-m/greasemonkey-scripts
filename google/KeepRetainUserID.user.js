// ==UserScript==
// @name        Google Keep - Retain user ID in URL
// @description Retain user ID in URL to show the same user's content on reload or session recovery
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/google
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/google/KeepRetainUserID.js
// @match       https://keep.google.com/u/*
// @version     1.1
// @grant       none
// @run-at      document-start
// ==/UserScript==
var url = window.location.href;
window.onload = function () {
  if (window.location.pathname == '/') {
    history.replaceState(null, '', url);
  };
};
