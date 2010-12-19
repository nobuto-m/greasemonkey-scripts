// ==UserScript==
// @name           LP_ReturnOfTheMap
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Display googlemap for users
// @include        https://launchpad.net/~*
// @include        https://edge.launchpad.net/~*
// @include        https://staging.launchpad.net/~*
// @date           2010-12-18
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==

var debug = 0;

// url format example
//http://maps.google.com/?ie=UTF8&ll=37.0625,-95.677068&spn=49.844639,73.564453&z=4
// <iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://maps.google.com/?ie=UTF8&amp;ll=37.0625,-95.677068&amp;spn=49.844639,73.564453&amp;z=4&amp;output=embed"></iframe><br /><small><a href="http://maps.google.com/?ie=UTF8&amp;ll=37.0625,-95.677068&amp;spn=49.844639,73.564453&amp;z=4&amp;source=embed" style="color:#0000FF;text-align:left">View Larger Map</a></small>

function xpath(query, context) {
    //    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

(function() {

    var place = xpath("//div[contains(@id,'portlet-map')]").snapshotItem(0);
    var cache = document.getElementsByTagName('script').item(8).textContent;
    var lat_start = cache.indexOf('latitude') + 11;
    var latitude = cache.substr(lat_start, 11);
    var long_start = cache.indexOf('longitude') + 12;
    var longitude = cache.substr(long_start, 10);
    longitude = longitude.replace(/,/,'');
    var ll = latitude + ',' + longitude;

    if (debug) {
        GM_log("latitude" + latitude);
        GM_log('longitude' + longitude);
    }

    if (latitude.match(/\d/)) {
        var base_url = 'http://maps.google.com/?ie=UTF8&amp;q=loc:' + ll + '&amp;iwloc=near&amp;';
        place.innerHTML += '<iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' + base_url + 'z=11&amp;output=embed"></iframe><br /><small><a href="' + base_url + 'z=11&amp;source=embed" style="color:#0000FF;text-align:left">View Larger Map</a></small>';
    }

})();
