var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var InfiniteScrollBehavior = require('kiubi/behaviors/infinite_scroll.js');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');

/* Filtres */
var FilterBtnView = require('./list/filter.btn.js');
var FilterSelectView = require('./list/filter.select.js');
var FilterSearchView = require('./list/filter.search.js');
var FilterInputView = require('./list/filter.input.js');
var FilterDropdownView = require('./list/filter.dropdown.js');
var FilterIntervalView = require('./list/filter.interval.js');

var filterCollection = Backbone.Collection.extend({
	model: Backbone.Model.extend({
		defaults: {
			id: null,
			title: '',
			type: 'select',
			extraClassname: '', // FilterBtnView, FilterDropdownView, FilterInputView, FilterIntervalView
			collectionPromise: null, // FilterBtnView, FilterSelectView, FilterDropdownView
			canDelete: false, // FilterInputView, FilterDropdownView, FilterIntervalView, FilterSearchView
			value: null, // FilterInputView, FilterIntervalView
			// prependText: '', // FilterInputView
			// disableLabelUpdate: '', // FilterDropdownView
			// enableDatepicker: '', // FilterIntervalView
		}
	})
});

var FiltersView = Marionette.CollectionView.extend({

	tagName: 'span',
	childView: FilterSelectView, // mandatory... but why oO ?

	buildChildView: function(child, ChildViewClass, childViewOptions) {

		// build the final list of options for the childView class
		var options = _.extend({
			model: child
		}, childViewOptions);

		switch (child.get('type')) {
			case 'select':
			default:
				return new FilterSelectView(options);
			case 'button':
				return new FilterBtnView(options);
			case 'search':
				return new FilterSearchView(options);
			case 'input':
				return new FilterInputView(options);
			case 'dropdown':
				return new FilterDropdownView(options);
			case 'interval':
				return new FilterIntervalView(options);
		}

	}

});

/* Listing */

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty"><span class="md-icon md-empty mb-2"></span>Il n\'y a encore rien à afficher</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: function() {
		var extra = this.getOption('extraListClassname') || '';
		return 'post-content post-list ' + extra;
	},
	emptyView: NoChildrenView,

	events: {
		'sortupdate': 'onSortUpdate'
	},

	onRender: function() {
		var scrollfix = 0;

		var params = {
			handle: ".btn-drag",
			axis: "y"
		};

		if (this.getOption('fixRelativeDragNDrop')) {
			params.start = function(event, ui) {
				if (Backbone.$(this).data('sortableFirst') != true) {
					scrollfix = Backbone.$('#content').scrollTop();
				} else {
					scrollfix = 0;
				}
				Backbone.$(this).data('sortableFirst', true);
			};
			params.sort = function(event, ui) {
				if (scrollfix > 0) {
					ui.helper.css({
						'top': ui.position.top - scrollfix + 'px'
					});
				}
			};
			params.change = function(event, ui) {
				scrollfix = 0;
			};
		}

		Backbone.$(this.el).sortable(params);
	},

	onAddChild: function(collectionView, rowView) {
		rowView.$el.attr('data-id', rowView.model.id);
	},

	onSortUpdate: function(e, ui) {
		var $childElement = ui.item;
		var newIndex = $childElement.parent().children().index($childElement);

		var model = this.collection.get($childElement.data('id'));
		var rowView = this.children.findByModel(model);

		var data = {};
		if (newIndex == 0) {
			data.before_id = $childElement.next().data('id');
		} else {
			data.after_id = $childElement.prev().data('id');
		}

		rowView.triggerMethod('sort:change', data);
		this.triggerMethod('sort:change', data);

		return true; // NEED to return true
	}

});

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.html'),

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		},

		detail: {
			el: "div[data-role='detail']",
			replaceElement: true
		},

		filters: {
			el: "span[data-role='filters']",
			replaceElement: true
		},

		xtra: {
			el: "span[data-role='xtra']",
			replaceElement: true
		},

		'new': {
			el: "div[data-role='new']",
			replaceElement: true
		}
	},

	title: 'Liste',

	/**
	 * Setup additionnal filtering elements
	 */
	filters: [],

	/**
	 * Setup additionnal actions elements like sorting
	 */
	xtra: [],

	/**
	 * Setup actions for selected elements
	 */
	selection: [],
	lock: false,

	/**
	 *
	 */
	newRowView: null,

	behaviors: [InfiniteScrollBehavior],

	// Setup for InfiniteScrollBehavior
	scrollThreshold: null,
	scrollContentEl: null,

	ui: {
		'loading': "div[data-role='loading']",
		'select': '#selection_all',
		'action': '[data-role="action"]',
		'action-main': '[data-role="bulk-action"]',
		'row-select': 'input[name="selection"]',
		'select-all': '[data-role="select-all"]',
		'counter': '[data-role="counter"]'
	},

	events: {
		'click @ui.select': 'selectAll',
		'click @ui.action': 'onAction',
		'hidden.bs.dropdown .btn-group': 'onHiddenDropDown',
		'click @ui.row-select': 'selectRow'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['rowView', 'newRowView']);

		this.listenTo(this.getOption('collection'), 'request', this.onCollectionRequest);
		this.listenTo(this.getOption('collection'), 'sync', this.onCollectionSync);
		this.listenTo(this.getOption('collection'), 'sync update', this.selectRow);
	},

	templateContext: function() {
		return {
			title: this.getOption('title'),
			selection: this.getOption('selection'),
			extraClassname: this.getOption('extraClassname')
		};
	},

	getChildren: function() {
		return this.getChildView('list').children;
	},

	/**
	 * Simulate filter addition
	 * 
	 * @param {String} name Filter id
	 */
	showFilter: function(name) {

		var filerView = this.getChildView('filters');
		if (!filerView) return;

		// Binded to 'add' filter
		var model = filerView.collection.get('add');
		if (!model) return;

		this.triggerMethod('filter:change', {
			model: model,
			value: name
			// view: ...
		});
	},

	/**
	 * Update counter text
	 *
	 * @param {String} text
	 */
	setCounterText: function(text) {
		this.getUI('counter').text(text);
	},

	onRender: function() {

		var childViewOptions = _.extend({
			proxy: this
		}, this.getOption('childViewOptions'));
		this.showChildView('list', new ListView({
			collection: this.getOption('collection'),
			childView: this.rowView,
			childViewOptions: childViewOptions,
			extraListClassname: this.getOption('extraListClassname'),
			fixRelativeDragNDrop: this.getOption('fixRelativeDragNDrop') || false
		}));

		if (this.getOption('filters').length > 0) {

			this.showChildView('filters', new FiltersView({
				collection: new filterCollection(this.getOption('filters')),
				childViewOptions: {
					proxy: this
				}
			}));

		}

		if (this.getOption('xtra').length > 0) {

			this.showChildView('xtra', new FiltersView({
				collection: new filterCollection(this.getOption('xtra')),
				childViewOptions: {
					proxy: this
				}
			}));

		}

		if (this.newRowView != null) {

			var options = _.extend({
				proxy: this,
				collection: this.getOption('collection')
			}, this.getOption('childViewOptions'));

			this.showChildView('new', new this.newRowView(options));
		}
		if (this.getOption('detailView')) {
			this.showChildView('detail', this.getOption('detailView'));
		}
	},

	/** Collection events **/

	onCollectionRequest: function(event, xhr, options) {
		if (!event.models) return; // not a collection event
		this.getUI('loading').show();
	},

	onCollectionSync: function(event) {
		this.getUI('loading').hide();
	},

	/** Row events **/

	selectRow: function() {

		var checked = Backbone.$('input[name="selection"]:checked', this.el).length;
		var total = Backbone.$('input[name="selection"]', this.el).length;

		// Affichage du bouton d'actions groupées et compteur de sélection
		if (checked > 0) {
			this.getUI('action-main').parent().parent().removeClass('d-none');
			this.getUI('select-all').addClass('d-none');
			this.setCounterText(' : ' + checked + (checked > 1 ? ' sélectionnés' : ' sélectionné'));
		} else {
			this.getUI('action-main').parent().parent().addClass('d-none');
			this.getUI('select-all').removeClass('d-none');
			this.setCounterText('');
		}

		// Etat du checkbox principal
		if (total == 0 || checked == 0) {
			this.getUI('select').prop('checked', false);
			this.getUI('select').removeClass('partiel');
		} else if (total == checked) {
			this.getUI('select').prop('checked', true);
			this.getUI('select').removeClass('partiel');
		} else {
			this.getUI('select').prop('checked', false);
			this.getUI('select').addClass('partiel');
		}
	},

	selectAll: function(event) {
		Backbone.$('input[name="selection"]', this.el).prop('checked', event.currentTarget.checked).change();
		this.selectRow();
	},

	onAction: function(event) {

		var btn = Backbone.$(event.currentTarget);

		var id = btn.data('id');

		if (id >= this.getOption('selection').length ||
			!this.getOption('selection')[id] ||
			!this.getOption('selection')[id].callback) {
			return;
		}

		var selection = this.getOption('selection')[id];

		if (selection.confirm && !btn.parent().hasClass('confirm-warning')) {
			btn.parent().addClass('confirm-warning');
			btn.data('title', btn.text());
			btn.text('Êtes-vous sûr ?');
			event.preventDefault();
			return false;
		}

		var listIds = Backbone.$(
				'input[name="selection"]:checked',
				this.getChildView('list').el)
			.map(function(i, input) {
				return input.value;
			});

		if (this.lock) {
			return;
		}
		this.lock = true;

		if (listIds.length == 0) {
			this.lock = false;
			return;
		}

		var promise = selection.callback(listIds);

		if (!promise) {
			if (selection.confirm) {
				btn.parent().removeClass('confirm-warning');
				btn.text(btn.data('title'));
			}
			this.lock = false;
			return;
		}

		var mainBtn = this.getUI('action-main').find('span:first-of-type');
		mainBtn.data('title', mainBtn.text());
		mainBtn.addClass('btn-load btn-load-inverse');
		mainBtn.html(LoaderTpl());

		promise.then(function() {
			this.lock = false;
			if (selection.confirm) {
				btn.parent().removeClass('confirm-warning');
				btn.text(btn.data('title'));
			}
			mainBtn.text(mainBtn.data('title'));
			mainBtn.removeClass('btn-load btn-load-inverse');

			// If action has deleted rows, need to update the checked counter
			this.selectRow();
		}.bind(this));
	},

	/**
	 * Restore confirmation buttons on dropdown menu hidding
	 *
	 * @param {Event} event
	 */
	onHiddenDropDown: function(event) {
		Backbone.$('.dropdown-menu a', event.currentTarget)
			.each(function(index, el) {
				el = Backbone.$(el);
				if (el.parent().hasClass('confirm-warning')) {
					el.text(el.data('title'));
					el.parent().removeClass('confirm-warning');
				}
			});
	},

	// Catch row sort:change event and add an ordered list of all rows
	onChildviewSortChange: function(data) {

		data.list = [];
		this.getChildView('list').$el.children().each(function(i, e) {
			data.list.push(Backbone.$(e).data('id'));
		});

		// Pass to parent view !
		this.triggerMethod('sort:change', data);
	}

});
