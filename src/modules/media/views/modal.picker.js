var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var SelectView = require('kiubi/views/ui/select.js');

var Folders = require('kiubi/modules/media/models/folders.js');

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
			is_selectable: this.selectableType == 'file' ? true : this.model.get('type') ==
				this.selectableType,
			is_selected: this.model.get('media_id') == this.selected,
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

	folder_id: null,
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
	currentOrder: '-date',

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			this.currentTerm = this.getUI('term').val();
			this.updateFilter();
		}, 300),
		'click @ui.order': 'changeOrder'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'collection', 'type']);
	},

	onRender: function() {

		var folders = new Folders();
		var folderPromise = folders.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		this.showChildView('categories', new SelectView({
			name: 'categories',
			// emptyLabel: 'Dossiers',
			collection: folders,
			selected: this.model.get('folder_id')
		}));

		this.showChildView('list', new ListView({
			collection: this.collection,
			selected: this.model.get('media_id'),
			selectableType: this.type
		}));

		if (this.model.get('folder_id') > 0) {
			this.currentFolder = this.model.get('folder_id');
			this.updateFilter();
		} else {
			folderPromise.done(function() {
				this.currentFolder = folders.at(0).get('folder_id');
				this.updateFilter();
			}.bind(this));
		}

	},

	onChildviewChange: function(value, view) {
		this.currentFolder = value;
		this.getUI('term').val('');
		this.currentTerm = '';
		this.updateFilter();
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
		this.collection.reset();
		this.collection.folder_id = null;
		this.collection.fetch({
			data: {
				folder_id: folder_id,
				term: term,
				sort: sort
			}
		});
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
