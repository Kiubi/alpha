var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var SelectView = require('kiubi/core/views/ui/select.js');

var ScrollBehavior = require('kiubi/behaviors/infinite_scroll.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/modal.picker.row.html'),
	className: 'list-item',

	events: {
		'click a[data-role="select"]': function() {
			this.triggerMethod('select:file', this.model);
		}
	},

	selectableType: 'image', // image|file
	selected: null,

	initialize: function(options) {
		this.mergeOptions(options, ['selectableType', 'selected']);
	},

	templateContext: function() {
		return {
			size: format.formatBytes(this.model.get('weight'), 2),
			is_selectable: this.selectableType == 'file' ? true : this.model.get('type') == this.selectableType,
			is_selected: this.model.get('media_id') == this.selected,
			has_thumb: this.model.get('thumb') ? true : false,
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	}

});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list list-media',
	childView: RowView,
	selectableType: 'image', // image|file
	selected: null,

	behaviors: [{
		behaviorClass: ScrollBehavior,
		contentEl: '.modal-body'
	}],

	initialize: function(options) {
		this.mergeOptions(options, ['selectableType', 'selected']);
	},

	buildChildView: function(child, ChildViewClass, childViewOptions) {
		// build the final list of options for the childView class
		var options = _.extend({
			model: child,
			selectableType: this.selectableType,
			selected: this.selected
		}, childViewOptions);
		// create the child view instance
		return new ChildViewClass(options);
	},

	// Proxy to parent view
	onChildviewSelectFile: function(model) {
		this.triggerMethod('select:file', model);
	}

});


module.exports = Marionette.View.extend({
	template: require('../templates/modal.picker.html'),

	// folder_id: null,
	type: 'image', // image|file

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		},
		categories: {
			el: "div[data-role='categories']",
			replaceElement: true
		}
	},

	ui: {
		'term': 'input[name="term"]',
		'order': '[data-role="order"] li'
	},

	currentFolder: null,
	currentTerm: null,
	currentOrder: null,

	currentFetch: null,
	rememberFolder: null,

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			this.currentTerm = this.getUI('term').val();
			this.updateFilter();
		}, 300),
		'click @ui.order': 'changeOrder'
	},

	initialize: function(options) {

		this.currentFolder = null;
		this.rememberFolder = true;

		this.mergeOptions(options, ['model', 'collection', 'type', 'folders', 'currentFolder', 'rememberFolder']);

		this.currentTerm = null;
		this.currentOrder = '-date';
		this.currentFetch = null;
	},

	onRender: function() {

		var folderPromise = this.folders.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var last = (this.rememberFolder) ? Session.getPref('last_folder') : null;

		if (this.model.get('folder_id') > 0) {
			this.currentFolder = this.model.get('folder_id');
			this.updateFilter();
			if (this.rememberFolder) Session.storePref('last_folder', this.currentFolder);
		} else if (last > 0) {
			this.currentFolder = last;
			this.updateFilter();
		} else {
			folderPromise.done(function() {
				this.currentFolder = this.folders.at(0).get('folder_id');
				this.updateFilter();
				if (this.rememberFolder) Session.storePref('last_folder', this.currentFolder);
			}.bind(this));
		}

		this.showChildView('categories', new SelectView({
			name: 'categories',
			// emptyLabel: 'Dossiers',
			collection: this.folders,
			selected: this.currentFolder
		}));

		this.showChildView('list', new ListView({
			collection: this.collection,
			selected: this.model.get('media_id'),
			selectableType: this.type
		}));

	},

	onChildviewChange: function(value, view) {
		this.currentFolder = value;
		this.getUI('term').val('');
		this.currentTerm = '';
		this.updateFilter();

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (this.rememberFolder) Session.storePref('last_folder', this.currentFolder);
	},

	changeOrder: function(event) {
		var order = Backbone.$(event.currentTarget).data('sort');
		if (order == '' || order == this.currentOrder) return;

		this.getUI('order').removeClass('active');
		Backbone.$(event.currentTarget).addClass('active');

		this.currentOrder = order;
		this.updateFilter();
	},

	updateFilter: function() {
		// ignore folder if there is a term
		this.fetchFiles(this.currentTerm == '' || this.currentTerm == null ? this.currentFolder : null, this.currentTerm,
			this.currentOrder);
	},

	fetchFiles: function(folder_id, term, sort) {

		if (this.currentFetch) {
			this.currentFetch.abort();
		}

		this.collection.reset(); // immediately clear listing BEFORE request
		this.collection.folder_id = null;
		this.currentFetch = this.collection.fetch({
			reset: true, // require to resolve merging concurrent requests
			data: {
				folder_id: folder_id,
				term: term,
				sort: sort
			}
		}).always(function() {
			this.currentFetch = null;
		}.bind(this));
	},

	onChildviewSelectFile: function(model) {
		this.model.set(model.toJSON());
		this.triggerMethod('close:modal');
	},

	templateContext: function() {
		return {
			'order': this.currentOrder
		};
	}

});
