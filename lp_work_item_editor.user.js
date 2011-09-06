// ==UserScript==
// @name           lp work item editor
// @namespace      https://launchpad.net/~mwhudson
// @include        https://blueprints.launchpad.net/*
// @include        https://blueprints.launchpad.dev/*
// @include        https://blueprints.staging.launchpad.net/*
// @include        https://blueprints.qastaging.launchpad.net/*
// ==/UserScript==

// hack for chrome support from https://gist.github.com/1143845
unsafeWindow.LPS || (
    unsafeWindow = (function() {
                        var el = document.createElement('p');
                        el.setAttribute('onclick', 'return window;');
                        return el.onclick();
                    }())
);


unsafeWindow.LPS.use(
    'lazr.choiceedit', 'lazr.overlay', 'widget-position-align',
    function (Y) {

/*
 * TODO: parse out assignees?
 * TODO: allow removing work items
 * TODO: allow reordering work items
 * TODO: allow editing the text of a work item
 */

var work_item_statuses = ["TODO", "DONE", "POSTPONED", "INPROGRESS", "BLOCKED"];
var work_item_synonyms = {
    "COMPLETED": "DONE",
    "POSTPONE": "POSTPONED",
    "DROP": "POSTPONED",
    "DROPPED": "POSTPONED"
};
var TD_TEMPLATE = '<td style="padding: 0.2em 1em 0.2em 0.2em" />';
var TH_TEMPLATE = '<th style="border: 1px solid lightgrey; padding: 0.2em 1em 0.2em 0.2em; font-weight: bold; text-align: center" />';
var TR_TEMPLATE = '<tr style="border: 1px solid lightgrey;" />';
var EDITICON_TEMPLATE = '<a href="#" class="editicon sprite edit"></a>';

function WorkItem (config) {
    WorkItem.superclass.constructor.apply(this, arguments);
}

WorkItem.ATTRS = {
    assignee: {

    },

    text: {

    },

    status: {

    },

    statusTextNode: {

    },

    statusTextNodeOffset: {

    }
};

Y.extend(WorkItem, Y.Base, {
    /**
     * createWorkItemRow
     *
     * This creates a "[work item text][work item status][edit icon]" node
     * and uses the `insert' argument to insert it into the DOM.
     *
     * This `insert' argument is a bit awkward (it would be neater to just
     * return the node) but it seems the node has to be in the DOM before
     * the widget that does the editing can be created successfully.
     */
    createWorkItemRow: function (insert) {
        var item_row = Y.Node.create(TR_TEMPLATE);

        var assignee_td = Y.Node.create(TD_TEMPLATE);
        var urlBase = Y.one('base').getAttribute('href').replace(
                /([a-z]*):\/\/blueprints.([^/]*)\/.*/, '$1://$2/~');
        var assignee = this.get('assignee');
        if (assignee) {
            assignee_td.appendChild(
                Y.Node.create('<a/>').set(
                    'text', assignee).setAttribute(
                        'href', urlBase + assignee));
        } else {
            assignee_td.appendChild('None');
        }
        // var editicon = Y.Node.create('<a href="#" class="editicon sprite edit"></a>');
        // editicon.setStyle('opacity', 0.0);
        // function fadeToHandler(opacity, duration) {
        //     function fade (e) {
        //         Y.log(e.target);
        //         var a = new Y.Anim(
        //             {
        //                 node: editicon,
        //                 to: {opacity: opacity},
        //                 duration: duration,
        //                 easing:   Y.Easing.easeOut
        //             }
        //         );
        //         a.run();
        //     }
        //     return fade;
        // }
        // assignee_td.on('mouseenter', fadeToHandler(1.0, 0.1));
        // assignee_td.on('mouseleave', fadeToHandler(0.0, 0.3));
        // assignee_td.appendChild(editicon);
//         var new_config = {
//             boundingBox: assignee_td,
//             contentBox: assignee_td,
// //            associated_field_id: associated_field_id,
//             align: {
//                 points: [Y.WidgetPositionAlign.CC,
//                          Y.WidgetPositionAlign.CC]
//             },
//             progressbar: true,
//             progress: 100,
// //            headerContent: "<h2>" + header + "</h2>",
// //            steptitle: step_title,
//             zIndex: 1001,
//             visible: false,
// //            filter_options: vocabulary_filters
//         };

//         var picker = new Y.lazr.picker.PersonPicker(new_config);

        item_row.appendChild(assignee_td);

        var text_td = Y.Node.create(TD_TEMPLATE);
        text_td.appendChild(document.createTextNode(this.get('text')));
        item_row.appendChild(text_td);

        var status_td = Y.Node.create(
            '<td><span class="value"></span><span class="button">&nbsp;</span></td>');
        status_td.one('.button').appendChild(EDITICON_TEMPLATE);
        status_td.one('.value').set('text', this.get('status'));

        item_row.appendChild(status_td);

        var items = [];
        Y.Array.each(
            work_item_statuses, function (s) {
                items.push({name: s, value:s});
            });
        var widget = new Y.ChoiceSource(
            {
                boundingBox: status_td,
                contentBox: status_td,
                value: status,
                title: 'Set workitem status',
                items: items,
                zIndex: 1001
            }
        );
        widget.render(item_row);
        var that = this;
        widget.on(
            'save', function (e) {
                e.preventDefault();
                that.set('status', widget.get('value'));
            });
        insert(item_row);
//        picker.render();
        return widget;
    },

    saveToDom: function (new_work_items_parent) {
        if (this.get('statusTextNode')) {
            var node = this.get('statusTextNode');
            var nodeTextPreserve = this.get('statusTextNodeOffset');
            var newText = node.get('text').slice(0, nodeTextPreserve) + ': ' + this.get('status');
            node.set('text', newText);
        } else {
            var textNode = document.createTextNode(this.get('text') + ': ' + this.get('status'));
            new_work_items_parent.appendChild(Y.Node.create('<br/>'));
            new_work_items_parent.appendChild(document.createTextNode('\n'));
            new_work_items_parent.appendChild(textNode);
        }
    }
});


/*
 * Parse the white board into lines.
 *
 * parse the whiteboard out of the DOM into an array of lines -- each
 * entry in the array is [<text content of the line>, <node that
 * contains the last bit of the text content>] so that the text can be
 * edited later.
 */

function parseWhiteBoardIntoLines (paras) {
    var children = [];
    Y.Array.each(
        paras.get('childNodes'),
        function (nodeList) {
            nodeList.each(function (n) { children.push(n); } );
            children.push(Y.Node.create('<br/>'));
            children.push(Y.Node.create('<br/>'));
        }
    );
    var lines = [];
    var cur_line = "";
    var last_text_node = null;
    for (var i = 0; i < children.length; i++ ) {
        var n = children[i];
        if (n.get('nodeName') == 'BR') {
            lines.push([cur_line, last_text_node]);
            cur_line = "";
        } else {
            cur_line += n.get('textContent');
            last_text_node = n;
        }
    }
    if (cur_line) {
        lines.push([cur_line, last_text_node]);
    }
    return lines;
}

function parseLinesIntoWorkItems (lines) {
    var work_items_re = /^work items(.*)\s*:\s*$/i;
    var in_work_item_block = false;
    var work_items = [];
    for (var j = 0; j < lines.length; j++ ) {
        var item = Y.Lang.trim(lines[j][0]);
        if (in_work_item_block) {
            if (!item.length) {
                in_work_item_block = false;
            } else {
                var colon_index = item.lastIndexOf(':');
                if (colon_index > 0) {
                    var assignee = null,
                        text = Y.Lang.trim(item.slice(0, colon_index)),
                        status = Y.Lang.trim(item.slice(colon_index+1));
                    if (text[0] == '[' && text.indexOf(']') > 0) {
                        assignee = text.slice(1, text.indexOf(']'));
                        text = text.slice(text.indexOf(']') + 1);
                    }
                    status = status.toUpperCase();
                    status = work_item_synonyms[status] || status;
                    work_items.push(
                        new WorkItem(
                            {
                                assignee: assignee,
                                text: text,
                                status: status,
                                statusTextNode: lines[j][1],
                                statusTextNodeOffset: lines[j][1].get("textContent").lastIndexOf(':')
                            })
                    );
                }
            }
        }
        else if (work_items_re.test(item)) {
            in_work_item_block = true;
        }
    }
    return work_items;
}

function clickAddWorkItem (e, insert_row, work_items) {
    e.preventDefault();
    var overlayBody = Y.Node.create('<span/>');
    overlayBody.appendChild('<input/>');
    var select = Y.Node.create('<select/>');
    for (var i = 0; i < work_item_statuses.length; i++) {
        select.appendChild(
            Y.Node.create('<option/>').setAttribute(
                 'value', work_item_statuses[i]).setContent(work_item_statuses[i]));
    }
    overlayBody.appendChild(select);
    overlayBody.appendChild(Y.Node.create('<button class="ov-add">Add</button>'));
    overlayBody.appendChild(Y.Node.create('<button class="ov-cancel">Cancel</button>'));
    var overlay = new Y.lazr.PrettyOverlay(
        {
            align: {
                points: [Y.WidgetPositionAlign.CC, Y.WidgetPositionAlign.CC]
            },
            headerContent: "<h2>Add new work item</h2>",
            bodyContent: overlayBody,
            visible: false,
            zIndex: 1001
        }
    );
    overlay.render();
    overlayBody.one('.ov-cancel').on('click', overlay.destroy, overlay);
    overlayBody.one('.ov-add').on(
       'click', function () {
            var item_text = overlayBody.one('input').get('value'),
                status = overlayBody.one('select').get('value'),
                new_work_item = new WorkItem(
                    {
                        text: item_text,
                        status: status,
                        statusTextNode: null,
                        statusTextNodeOffset: null
                    });
            work_items.push(new_work_item);
            new_work_item.createWorkItemRow(insert_row);
            overlay.destroy();
        }
    );
    overlay.show();
    overlayBody.one('input').focus();
};

function log (o) { unsafeWindow.console.log(o); }

function applyEdits (e, work_items, new_work_items_parent) {
    for (var i = 0; i < work_items.length; i++) {
        work_items[i].saveToDom(new_work_items_parent);
    }
    var editableText = Y.lp.widgets['edit-whiteboard'];
    Y.one('#edit-whiteboard .edit').replaceClass('edit', 'loading');
    var handle = editableText.editor.on(
        'save', function () {
            handle.detach();
            Y.one('#edit-whiteboard .loading').replaceClass('loading', 'edit');
        });
    editableText.editor.setInput(editableText.get('value'));
    editableText.editor.save();
    this.destroy();
}

function clickEdit (e) {
    var p = Y.all('#edit-whiteboard p');
    var lines = parseWhiteBoardIntoLines(p);
    var work_items = parseLinesIntoWorkItems(lines);
    var overlayBody = Y.Node.create('<div/>');

    var item_container = Y.Node.create('<table style="margin: 1em" />');
    var headings = Y.Node.create(TR_TEMPLATE);
    Y.Array.each(
        ['Assignee', 'Work item description', 'Status'],
        function (heading) {
            headings.appendChild(Y.Node.create(TH_TEMPLATE).set('text', heading));
        });
    item_container.appendChild(headings);
    Y.Array.each(
        work_items, function (wi) {
            wi.createWorkItemRow(function(li) { item_container.appendChild(li);});
        }
    );
    var add_item_row = Y.Node.create('<tr/>');
    var link = Y.Node.create(
        '<td style="text-align="right" colspan="3"><a href="#" class="sprite add js-action">Add new work item</a></td>');
    link.on(
        'click', clickAddWorkItem, link, function (row) { item_container.insertBefore(row, add_item_row); }, work_items);
    add_item_row.appendChild(link);
    item_container.appendChild(add_item_row);
    overlayBody.appendChild(item_container);
    overlayBody.appendChild(
        Y.Node.create(
            '<span><button class="ov-ok">OK</button><button class="ov-cancel">Cancel</button></span>'));
    var overlay = new Y.lazr.PrettyOverlay(
        {
            align: {
                points: [Y.WidgetPositionAlign.CC, Y.WidgetPositionAlign.CC]
            },
            headerContent: "<h2>Edit work items</h2>",
            bodyContent: overlayBody,
            visible: false,
            zIndex: 1000
        }
    );
    overlay.render();

    var new_work_items_parent = null;
    if (work_items.length > 0) {
        new_work_items_parent = work_items[work_items.length - 1].get('statusTextNode').ancestor('p');
    } else {
        new_work_items_parent = Y.Node.create('<p>Work Items:</p>');
        Y.one("#edit-whiteboard div.yui3-editable_text-text").appendChild(new_work_items_parent);
    }

    overlayBody.one('.ov-ok').on(
        'click', applyEdits, overlay, work_items, new_work_items_parent);
    overlayBody.one('.ov-cancel').on(
        'click', overlay.destroy, overlay);

    overlay.show();
}

function setUp () {
    var h3 = Y.one('#edit-whiteboard h3');
    if (!h3) return;
    h3.appendChild(document.createTextNode(' '));
    var editButton = Y.Node.create('<button>Open workitem editor</button>');
    editButton.on('click', clickEdit);
    h3.appendChild(editButton);
}

setUp();
});
