// ==UserScript==
// @name           LP_QuestionComment
// @namespace      http://murraytwins.com/greasemonkey/
// @description    (Launchpad) Prefill question comment
// @include        https://launchpad.net/*
// @include        https://*.launchpad.net/*
// @include        https://*.edge.launchpad.net/*
// @include        https://launchpad.net/*
// @date           2008-08-13
// @creator        Brian Murray <brian@ubuntu.com>
// ==/UserScript==


(function() {

// ------  User settable data  -------------
// Comment to use

var comment =  "Thank you for taking the time to report this issue and helping to make Ubuntu better. Examining the information you have given us, this does not appear to be a bug report so we are closing it and converting it to a question in the support tracker. We understand the difficulties you are facing, but it is better to raise problems you are having in the support tracker at https://answers.launchpad.net/ubuntu if you are uncertain if they are bugs. You can also find help posting your problem in the support forum of your local Ubuntu's community http://loco.ubuntu.com/ or asking at http://askubuntu.com. For help on reporting bugs, see https://help.ubuntu.com/community/ReportingBugs."

// ------- End of User settable data -------

function xpath(query, context) {
    context = context ? context : document;
    return document.evaluate(query, context, null,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

if (xpath('//div[@class="actions"]/input[@value="Convert this Bug into a Question"]').snapshotItem(0)) {
    xpath('//textarea[@id="field.comment"]').snapshotItem(0).value = comment;
}

})(); 
