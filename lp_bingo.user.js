// ==UserScript==
// @name           LP_Bingo
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Play bug jam bingo!
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-08-06
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==


(function() {

// List of bingo words and card spots
var buzz_words = {
    'microsoft':'B1',
    'bug 1':'B2',
    'suse':'B3',
    'gentoo':'B4',
    'help':'B5',
    'dpkg --reconfigure':'B6',
    'test':'B7',
    'tainted':'B8',
    'intrepid':'B9',
    'debian':'B10',
    'sun':'B11',
    'gnu':'B12',
    'verse':'B13',
    'forever':'B14',
    'backtrace':'B15',
    'serious':'I16',
    'grave':'I17',
    'critical':'I18',
    'unstable':'I19',
    'computer':'I20',
    'laptop':'I21',
    'unknown':'I22',
    'password':'I23',
    'broken':'I24',
    'freeze':'I25',
    'restart':'I26',
    'reproduce':'I27',
    'segfault':'I28',
    'compile':'I29',
    'battery':'I30',
    'fisty':'N32',
    'gusty':'N33',
    'harty':'N34',
    'thanks':'N35',
    'stuck':'N36',
    'impossible':'N37',
    'crazy':'N38',
    'dvd':'N39',
    'ethernet':'N40',
    'wireless':'N41',
    'security':'N42',
    'best':'N43',
    'brian':'N44',
    'killed':'N45',
    'binary':'G46',
    'please':'G48',
    'reinstall':'G49',
    'crash':'G50',
    'love':'G51',
    'power':'G52',
    'forums':'G53',
    'warning':'G54',
    'irc':'G55',
    'gdb':'G56',
    'breaks':'G57',
    'encrypt':'G58',
    'corrupt':'G59',
    'luck':'G60',
    'chicken':'O61',
    'sudo':'O62',
    'button':'O63',
    'upstream':'O64',
    'deprecated':'O65',
    'rock':'O66',
    'resume':'O67',
    'quality':'O68',
    'test':'O69',
    'kernel':'O70',
    'regression':'O71',
    'bzr':'O72',
    'vulnerability':'O73',
    'patch':'O74',
    'fail':'O75'
}
// ------- End of User settable data -------

function xpath(query, context) {
//    GM_log('xpath running');
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

window.addEventListener("load", function(e) {

    var debug = 0

    var bug_heading = xpath("//title").snapshotItem(0);
    if (debug) {
        GM_log( "title " + bug_heading );
    }
   
//    var description = xpath("//body//div[contains(@class,'report')]/div[contains(@id,'bug-description')]");
//    var description = xpath("//body//div[@class='report']/div[@id='bug-description']");
    var description = document.getElementById('bug-description').textContent;
    for (var word in buzz_words) {
        var re = new RegExp(word,"mig");
        if (re.exec(description) != null) {
            if (debug) {
                GM_log( "bingo " + buzz_words[word] );
            }
            alert( buzz_words[word] + " the word " + word + " was found!" );
            return
        }
    }

  }, false);
})(); 
