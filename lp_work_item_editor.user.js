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

/*
 * What follows is a copy paste hack of ChoiceSource from the
 * Launchpad source.  The only changes are
 *
 * 1) commenting out the line "editicon.original_src =
 * editicon.get("src");" which always seems to fail when creating the
 * widget from js, and
 *
 * 2) setting a zIndex on the ChoiceList.
 */

/**
 * This class provides the ability to allow a specific field to be
 *  chosen from an enum, similar to a dropdown.
 *
 * This can be thought of as a rather pretty Ajax-enhanced dropdown menu.
 *
 * @module lazr.choiceedit
 */

var CHOICESOURCE       = 'ichoicesource',
    CHOICELIST         = 'ichoicelist',
    NULLCHOICESOURCE   = 'inullchoicesource',
    C_EDITICON         = 'editicon',
    C_VALUELOCATION    = 'value',
    C_NULLTEXTLOCATION = 'nulltext',
    C_ADDICON          = 'addicon',
    SAVE               = 'save',
    LEFT_MOUSE_BUTTON  = 1,
    RENDERUI           = "renderUI",
    BINDUI             = "bindUI",
    SYNCUI             = "syncUI",
    NOTHING            = new Object();

/**
 * This class provides the ability to allow a specific field to be
 * chosen from an enum, similar to a dropdown.
 *
 * @class ChoiceSource
 * @extends Widget
 * @constructor
 */

var ChoiceSource = function() {
    ChoiceSource.superclass.constructor.apply(this, arguments);
    Y.after(this._bindUIChoiceSource, this, BINDUI);
    Y.after(this._syncUIChoiceSource, this, SYNCUI);
};

ChoiceSource.NAME = CHOICESOURCE;

/**
 * Dictionary of selectors to define subparts of the widget that we care about.
 * YUI calls ATTRS.set(foo) for each foo defined here
 *
 * @property InlineEditor.HTML_PARSER
 * @type Object
 * @static
 */
ChoiceSource.HTML_PARSER = {
    value_location: '.' + C_VALUELOCATION,
    editicon: '.' + C_EDITICON
};

ChoiceSource.ATTRS = {
    /**
     * Possible values of the enum that the user chooses from.
     *
     * @attribute items
     * @type Array
     */
    items: {
        value: []
    },

    /**
     * Current value of enum
     *
     * @attribute value
     * @type String
     * @default null
     */
    value: {
        value: null
    },

    /**
     * List header displayed in the popup
     *
     * @attribute title
     * @type String
     * @default ""
     */
    title: {
        value: ""
    },

    /**
     * Y.Node displaying the current value of the field. Should be
     * automatically calculated by HTML_PARSER.
     * Setter function returns Y.one(parameter) so that you can pass
     * either a Node (as expected) or a selector.
     *
     * @attribute value_location
     * @type Node
     */
    value_location: {
      value: null,
      setter: function(v) {
        return Y.one(v);
      }
    },

    /**
     * Y.Node (img) displaying the editicon, which is exchanged for a spinner
     * while saving happens. Should be automatically calculated by HTML_PARSER.
     * Setter function returns Y.one(parameter) so that you can pass
     * either a Node (as expected) or a selector.
     *
     * @attribute value_location
     * @type Node
     */
    editicon: {
      value: null,
      setter: function(v) {
        return Y.one(v);
      }
    },

    /**
     * Y.Node display the action icon. The default implementation just returns
     * the edit icon, but it can be customized to return other elements in
     * subclasses.
     * @attribute actionicon
     * @type Node
     */
    actionicon: {
      getter: function() {
        return this.get('editicon');
      }
    },

    elementToFlash: {
      value: null,
      setter: function(v) {
        return Y.one(v);
      }
    },

    backgroundColor: {
      value: null
    },

    clickable_content: {
      value: true
    },

    zIndex: {
      value: 1000
    }
};

Y.extend(ChoiceSource, Y.Widget, {
    initializer: function(cfg) {
        /**
         * Fires when the user selects an item
         *
         * @event save
         * @preventable _saveData
         */
        this.publish(SAVE);

        var editicon = this.get('editicon');
        //editicon.original_src = editicon.get("src");
    },

    /**
     * bind UI events
     * <p>
     * This method is invoked after bindUI is invoked for the Widget class
     * using YUI's aop infrastructure.
     * </p>
     *
     * @method _bindUIChoiceSource
     * @protected
     */
    _bindUIChoiceSource: function() {
        var that = this;
        if (this.get('clickable_content')) {
            var clickable_element = this.get('contentBox');
        } else {
            var clickable_element = this.get('editicon');
        }
        clickable_element.on("click", this.onClick, this);

        this.after("valueChange", function(e) {
            this.syncUI();
            this._showSucceeded();
        });
    },

    /**
     * Update in-page HTML with current value of the field
     * <p>
     * This method is invoked after syncUI is invoked for the Widget class
     * using YUI's aop infrastructure.
     * </p>
     *
     * @method _syncUIChoiceSource
     * @protected
     */
    _syncUIChoiceSource: function() {
        var items = this.get("items");
        var value = this.get("value");
        var node = this.get("value_location");
        for (var i=0; i<items.length; i++) {
            if (items[i].value == value) {
                node.set("innerHTML", items[i].source_name || items[i].name);
            }
        }
    },

    _chosen_value: NOTHING,

    /**
     * Get the currently chosen value.
     *
     * Compatible with the Launchpad PATCH plugin.
     *
     * @method getInput
     */
    getInput: function() {
        if (this._chosen_value !== NOTHING) {
          return this._chosen_value;
        } else {
          return this.get("value");
        }
    },

    /**
     * Handle click and create the ChoiceList to allow user to
     * select an item
     *
     * @method onClick
     * @private
     */
    onClick: function(e) {

        // Only continue if the down button is the left one.
        if (e.button != LEFT_MOUSE_BUTTON) {
            return;
        }

        this._choice_list = new Y.ChoiceList({
            value:          this.get("value"),
            title:          this.get("title"),
            items:          this.get("items"),
            value_location: this.get("value_location"),
            progressbar:    false,
            zIndex:         this.get("zIndex")
        });

        var that = this;
        this._choice_list.on("valueChosen", function(e) {
            that._chosen_value = e.details[0];
            that._saveData(e.details[0]);
        });

        // Stuff the mouse coordinates into the list object,
        // by the time we'll need them, they won't be available.
        this._choice_list._mouseX = e.clientX + window.pageXOffset;
        this._choice_list._mouseY = e.clientY + window.pageYOffset;

        this._choice_list.render();

        e.halt();
    },

    /**
     * bind UI events
     *
     * @private
     * @method _saveData
     */
    _saveData: function(newvalue) {
        this.set("value", newvalue);
        this.fire(SAVE);
    },

    /**
     * Called when save has succeeded to flash the in-page HTML green.
     *
     * @private
     * @method _showSucceeded
     */
    _showSucceeded: function() {
        this._uiAnimateFlash(Y.lp.anim.green_flash);
    },

    /**
     * Called when save has failed to flash the in-page HTML red.
     *
     * @private
     * @method _showFailed
     */
    _showFailed: function() {
        this._uiAnimateFlash(Y.lp.anim.red_flash);
    },

    /**
     * Run a flash-in animation on the editable text node.
     *
     * @method _uiAnimateFlash
     * @param flash_fn {Function} A lp.anim flash-in function.
     * @protected
     */
    _uiAnimateFlash: function(flash_fn) {
        var node = this.get('elementToFlash');
        if (node === null) {
          node = this.get('contentBox');
        }
        var cfg = { node: node };
        if (this.get('backgroundColor') !== null) {
          cfg.to = {backgroundColor: this.get('backgroundColor')};
        }
        var anim = flash_fn(cfg);
        anim.run();
    },

    /**
     * Set the 'waiting' user-interface state.  Be sure to call
     * _uiClearWaiting() when you are done.
     *
     * @method _uiSetWaiting
     * @protected
     */
    _uiSetWaiting: function() {
        var actionicon = this.get("actionicon");
        actionicon.original_src = actionicon.get("src");
        actionicon.set("src", "https://launchpad.net/@@/spinner");
    },

    /**
     * Clear the 'waiting' user-interface state.
     *
     * @method _uiClearWaiting
     * @protected
     */
    _uiClearWaiting: function() {
        var actionicon = this.get("actionicon");
        actionicon.set("src", actionicon.original_src);
    }

});


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
        var assignee = this.get('assignee');
        if (assignee) {
            assignee_td.appendChild(assignee);
        } else {
            assignee_td.appendChild('None');
        }
        //assignee_td.appendChild('<a href="#" class="editicon sprite edit"></a>');
        item_row.appendChild(assignee_td);

        var text_td = Y.Node.create(TD_TEMPLATE);
        text_td.appendChild(this.get('text'));
        item_row.appendChild(text_td);

        var status_td = Y.Node.create(
            '<td><span class="value"></span><span>&nbsp;<a href="#" class="editicon sprite edit"></a></span></td>');
        status_td.one('.value').set('text', this.get('status'));

        item_row.appendChild(status_td);

        var items = [];
        Y.Array.each(
            work_item_statuses, function (s) {
                items.push({name: s, value:s});
            });
        var widget = new ChoiceSource(
            {
                boundingBox: status_td,
                contentBox: status_td,
                value: status,
                title: 'Set workitem status',
                items: items,
                zIndex: 1001
            }
        );
        insert(item_row);
        return widget;
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

function clickAddWorkItem (e, item_container, add_item_row, adds) {
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
                add_index = adds.length,
                new_work_item = new WorkItem(
                    {
                        text: item_text,
                        status: status,
                        statusTextNode: null,
                        statusTextNodeOffset: null
                    });
            adds.push(new_work_item);
            var widget = new_work_item.createWorkItemRow(
                function (row) { item_container.insertBefore(row, add_item_row); });
            widget.render();
            widget.on(
                'save', function (e) {
                    e.preventDefault();
                    adds[add_index].set('status', widget.get('value'));
                });
            overlay.destroy();
        }
    );
    overlay.show();
    overlayBody.one('input').focus();
};

function log (o) { unsafeWindow.console.log(o); }

function applyEdits (e, work_items, edits, adds) {
    if (edits.length || adds.length) {
        for (var i = 0; i < edits.length; i++) {
            var node = work_items[edits[i][0]].get('statusTextNode');
            var nodeTextPreserve = work_items[edits[i][0]].get('statusTextNodeOffset');
            var newText = node.get('text').slice(0, nodeTextPreserve) + ': ' + edits[i][1];
            node.set('text', newText);
        }
        var q = null;
        if (work_items.length > 0) {
            q = work_items[work_items.length - 1].get('statusTextNode').ancestor('p');
        } else {
            q = Y.Node.create('<p>Work Items:</p>');
            Y.one("#edit-whiteboard div.yui3-editable_text-text").appendChild(q);
        }
        for (var j = 0; j < adds.length; j++) {
            var textNode = document.createTextNode(adds[j].get('text') + ': ' + adds[j].get('status'));
            q.appendChild(Y.Node.create('<br/>'));
            q.appendChild(document.createTextNode('\n'));
            q.appendChild(textNode);
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
    }
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
    var edits = [];
    var adds = [];
    var widgets = [];
    Y.Array.each(
        work_items, function (wi, index) {
            var widget = wi.createWorkItemRow(function(li) { item_container.appendChild(li);});
            widgets.push(widget);
            widget.on(
                'save', function (e) {
                    e.preventDefault();
                    edits.push([index, widget.get('value')]);
                });
        }
    );
    var add_item_row = Y.Node.create('<tr/>');
    var link = Y.Node.create(
        '<td style="text-align="right" colspan="2"><a href="#" class="sprite add js-action">Add new work item</a></td>');
    link.on(
        'click', clickAddWorkItem, link, item_container, add_item_row, adds);
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
    Y.Array.each(widgets, function (w) { w.render(); });

    overlayBody.one('.ov-ok').on(
        'click', applyEdits, overlay, work_items, edits, adds);
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
