// ==UserScript==
// @name           lp work item editor
// @namespace      https://launchpad.net/~mwhudson
// @include        https://blueprints.launchpad.net/*
// @include        https://blueprints.launchpad.dev/*
// @include        https://blueprints.staging.launchpad.net/*
// @include        https://blueprints.qastaging.launchpad.net/*
// ==/UserScript==

// hack for chrome support from https://gist.github.com/1143845
unsafeWindow.LPJS || (
    unsafeWindow = (function() {
                        var el = document.createElement('p');
                        el.setAttribute('onclick', 'return window;');
                        return el.onclick();
                    }())
);


unsafeWindow.LPJS.use(
    'lazr.choiceedit', 'lazr.overlay', 'widget-position-align', 'lp.app.picker',
    'lazr.activator', 'stylesheet', 'lazr.editor',
    function (Y) {

/*
 * TODO: track milestones
 * TODO: allow reordering work items
 */

var work_item_statuses = ["TODO", "DONE", "POSTPONED", "INPROGRESS", "BLOCKED"];
var work_item_synonyms = {
    "COMPLETED": "DONE",
    "POSTPONE": "POSTPONED",
    "DROP": "POSTPONED",
    "DROPPED": "POSTPONED"
};
var TD_TEMPLATE =       '<td style="padding: 0.2em 1em 0.2em 0.2em; border-bottom: 1px solid lightgrey;" />';
var TD_TEMPLATE_LEFT  = '<td style="padding: 0.2em 1em 0.2em 0.2em; border-bottom: 1px solid lightgrey; border-left: 1px solid lightgrey" />';
var TD_TEMPLATE_RIGHT = '<td style="padding: 0.2em 1em 0.2em 0.2em; border-bottom: 1px solid lightgrey;border-right: 1px solid lightgrey" />';
var TH_TEMPLATE       = '<th style="padding: 0.2em 1em 0.2em 0.2em; border: 1px solid lightgrey; font-weight: bold; text-align: center" />';
var TR_TEMPLATE = '<tr />';
var EDITICON_TEMPLATE = '<a href="#" class="editicon sprite edit"></a>';
var DELETEICON_TEMPLATE = '<a href="#" class="editicon sprite trash-icon"></a>';

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

    statusTextNodes: {

    },

    deleted: {
        value: false
    }
};

function personLink (name) {
    if (name) {
        var loc = null;
        if (Y.one('base')) {
            loc = Y.one('base').getAttribute('href');
        } else {
            loc = window.location.toString();
        }
        var urlBase = loc.replace(/([a-z]*):\/\/blueprints.([^/]*)\/.*/, '$1://$2/~');
        return Y.Node.create('<a/>').set('text', name).setAttribute('href', urlBase + name);
    } else {
        return 'None';
    }
}

function setUpAnims (icon, parent) {
    icon.setStyle('opacity', 0.0);
    var anim = null;
    function fadeToHandler(opacity, duration) {
        function fade (e) {
            if (anim) { anim.stop(); }
            anim = new Y.Anim(
                {
                    node: icon,
                    to: {opacity: opacity},
                    duration: duration,
                    easing:   Y.Easing.easeOut
                }
            );
            anim.run();
        }
        return fade;
    }
    parent.on('mouseenter', fadeToHandler(1.0, 0.1));
    parent.on('mouseleave', fadeToHandler(0.0, 0.3));
}

Y.extend(WorkItem, Y.Base, {
    /**
     * createWorkItemRow
     *
     * This creates a "[work item text][work item status][edit icon]" node.
     */
    createWorkItemRow: function () {
        var item_row = Y.Node.create(TR_TEMPLATE);

        var assignee_td = Y.Node.create(TD_TEMPLATE_LEFT);
        var container = Y.Node.create('<span class="yui3-activator-data-box"></span>');

        container.appendChild(personLink(this.get('assignee')));
        assignee_td.appendChild(container);
        assignee_td.appendChild('<div class="yui3-activator-message-box yui3-activator-hidden"></div>');
        assignee_td.appendChild('<button class="lazr-btn yui3-activator-act yui3-activator-hidden">Edit</button>');
        var activator = new Y.lazr.activator.Activator(
            {
                contentBox: assignee_td,
                boundingBox: assignee_td
            });

        item_row.appendChild(assignee_td);
        activator.render(item_row);
        setUpAnims(assignee_td.one('.yui3-activator-act'), assignee_td);
        activator.on('act', this.showPersonPicker, this);

        var text_td = Y.Node.create(TD_TEMPLATE);
        var text_node = Y.Node.create(
            '<span class="status-edit"><span class="yui3-editable_text-trigger"><span class="yui3-editable_text-text"></span></span></span>');
        text_node.one('.yui3-editable_text-text').setContent(this.get('text'));
        text_node.one('.yui3-editable_text-trigger').appendChild(EDITICON_TEMPLATE);

        text_td.appendChild(text_node);
        item_row.appendChild(text_td);
        setUpAnims(text_node.one('a'), text_td);
        var text_editor = new Y.EditableText(
            {
                contentBox: text_node,
                boundingBox: text_node,
                accept_empty: false
            });
        text_editor.render(text_td);
        text_editor.editor.on(
            'save', function (e) {
                this.set('text', e.target.get('value'));
            }, this);

        var status_td = Y.Node.create(TD_TEMPLATE_RIGHT);
        status_td.appendChild('<span class="value"></span><span class="button">&nbsp;</span>');
        var status_editicon = Y.Node.create(EDITICON_TEMPLATE);
        setUpAnims(status_editicon, status_td);
        status_td.one('.button').appendChild(status_editicon);
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
        widget.on(
            'save', function (e) {
                e.preventDefault();
                this.set('status', widget.get('value'));
            }, this);

        var delete_icon = Y.Node.create(DELETEICON_TEMPLATE);
        item_row.appendChild(
            Y.Node.create(
                '<td style="padding: 0.2em 1em 0.2em 0.2em"/>').appendChild(delete_icon));
        delete_icon.on(
            'click', function (e) {
                e.preventDefault();
                item_row.remove();
                this.set('deleted', true);
            }, this);

        return item_row;
    },

    showPersonPicker: function (e) {
        var act = e.target;
        var picker = Y.lp.app.picker.create(
            'ValidPersonOrTeam', {
                picker_type: "person",
                selected_value: this.get('assignee')
            });
        picker.set('zIndex', 1001);
        picker.show();
        picker.on(
            'save', function (e) {
                this.set('assignee', e.value);
                act.renderSuccess(personLink(e.value));
            }, this);
    },

    toTextNode: function () {
        var work_item_text = '\n';
        if (this.get('assignee')) {
            work_item_text += '[' + this.get('assignee') + '] ';
        }
        work_item_text += this.get('text') + ': ' + this.get('status');
        return document.createTextNode(work_item_text);
    },

    saveToDom: function (new_work_items_parent) {
        if (this.get('statusTextNodes')) {
            var nodes = this.get('statusTextNodes');
            if (!this.get('deleted')) {
                var parent = nodes[0].ancestor();
                parent.insertBefore(this.toTextNode(), nodes[0]);
            }
            Y.Array.each(nodes, function (n) { n.remove(); });
        } else {
            if (!this.get('deleted')) {
                new_work_items_parent.appendChild(Y.Node.create('<br/>'));
                new_work_items_parent.appendChild(this.toTextNode());
            }
        }
    }
});


/*
 * Parse the white board into lines.
 *
 * parse the whiteboard out of the DOM into an array of lines -- each
 * entry in the array is [<text content of the line>, [<nodes that
 * make up line>] so that the text can be edited later.
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
    var cur_line_nodes = [];
    for (var i = 0; i < children.length; i++ ) {
        var n = children[i];
        if (n.get('nodeName') == 'BR') {
            lines.push([cur_line, cur_line_nodes]);
            cur_line = "";
            cur_line_nodes = [];
        } else {
            cur_line += n.get('textContent');
            cur_line_nodes.push(n);
        }
    }
    if (cur_line) {
        lines.push([cur_line, cur_line_nodes]);
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
                        text = Y.Lang.trim(text.slice(text.indexOf(']') + 1));
                    }
                    status = status.toUpperCase();
                    status = work_item_synonyms[status] || status;
                    work_items.push(
                        new WorkItem(
                            {
                                assignee: assignee,
                                text: text,
                                status: status,
                                statusTextNodes: lines[j][1]
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
                        statusTextNodes: null
                    });
            work_items.push(new_work_item);
            insert_row(new_work_item.createWorkItemRow());
            overlay.destroy();
        }
    );
    overlay.show();
    overlayBody.one('input').focus();
};

function applyEdits (e, work_items, new_work_items_parent) {
    for (var i = 0; i < work_items.length; i++) {
        work_items[i].saveToDom(new_work_items_parent);
    }
    var editableText = Y.lp.widgets['edit-workitems_text'];
    Y.one('#edit-workitems_text .edit').replaceClass('edit', 'loading');
    var handle = editableText.editor.on(
        'save', function () {
            handle.detach();
            Y.one('#edit-workitems_text .loading').replaceClass('loading', 'edit');
        });
    editableText.editor.setInput(editableText.get('value'));
    editableText.editor.save();
    this.destroy();
}

function clickEdit (e) {
    var p = Y.all('#edit-workitems_text p');
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
    headings.append('<th/>');
    item_container.appendChild(headings);
    Y.Array.each(
        work_items, function (wi) {
            item_container.appendChild(wi.createWorkItemRow());
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
        new_work_items_parent = work_items[work_items.length - 1].get('statusTextNodes')[0].ancestor('p');
    } else {
        new_work_items_parent = Y.Node.create('<p>Work Items:</p>');
        Y.one("#edit-workitems_text div.yui3-editable_text-text").appendChild(new_work_items_parent);
    }

    overlayBody.one('.ov-ok').on(
        'click', applyEdits, overlay, work_items, new_work_items_parent);
    overlayBody.one('.ov-cancel').on(
        'click', overlay.destroy, overlay);

    overlay.show();
}

function setUp () {
    var h3 = Y.one('#edit-workitems_text h3');
    if (!h3) return;
    new Y.StyleSheet('.status-edit .yui3-editable_text-text:hover { cursor: pointer; text-decoration: underline; }');
    h3.appendChild(document.createTextNode(' '));
    var editButton = Y.Node.create('<button>Open workitem editor</button>');
    editButton.on('click', clickEdit);
    h3.appendChild(editButton);
}

setUp();
});
