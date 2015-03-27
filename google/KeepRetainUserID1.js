// ==UserScript==
// @name        Google Keep - Retain user ID 1 in URL
// @description Retain user ID 1 in URL to show the same user's content on reload or session recovery
// @namespace   https://github.com/nobuto-m/greasemonkey-scripts/tree/master/google
// @updateURL   https://github.com/nobuto-m/greasemonkey-scripts/raw/master/google/KeepRetainUserID1.js
// @match       https://keep.google.com/u/1/
// @version     1
// @grant       none
// ==/UserScript==
history.replaceState(null, '', '/u/1/');
