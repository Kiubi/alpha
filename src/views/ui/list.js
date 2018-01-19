var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var InfiniteScrollBehavior = require('kiubi/behaviors/infinite_scroll.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var LoaderTpl = require('kiubi/templates/ui/loader.html');

var FiltersView = Marionette.View.extend({
	template: require('kiubi/templates/ui/list.filters.html'),

	tagName: 'div',
	className: 'btn-group',

	behaviors: [SelectifyBehavior],

	templateContext: function() {
		return {
			filters: this.getOption('filters'),
			indent2Space: function(indent) {
				if (indent == 0) return '';
				var str = '';
				for (var i = 0; i < indent; i++) {
					str += '&nbsp;&nbsp;';
				}
				return str;
			}
		};
	},

	events: {
		'change select': 'onSelectChange'
	},

	initialize: function(options) {

		this.mergeOptions(options);

		_.each(this.getOption('filters'), function(filter) {
			// Rerender on collection fetch
			this.listenTo(filter.collection, 'sync', this.onCollectionSync);
			if (filter.collection.length == 0) filter.collection.fetch();
		}.bind(this));
	},

	onCollectionSync: function() {
		this.render();
	},

	onSelectChange: function(event) {
		var $select = Backbone.$(event.currentTarget, this.el);

		if ($select.data('id') > this.getOption('filters').length) {
			return;
		}

		var filter = this.getOption('filters')[$select.data('id')];

		this.triggerMethod('filter:change', {
			index: $select.data('id'),
			value: $select.val()
		});
	}

});

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Il n\'y a encore rien à afficher...</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list',
	emptyView: NoChildrenView,

	events: {
		'sortupdate': 'onSortUpdate'
	},

	onRender: function() {
		Backbone.$(this.el).sortable({
			handle: ".btn-drag",
			axis: "y"
		});
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

		return true; // NEED to return true
	}

});

module.exports = Marionette.View.extend({
	template: require('kiubi/templates/ui/list.html'),

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		},

		filters: {
			el: "span[data-role='filters']",
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
	filterModal: null,

	/**
	 * Setup the button that can change the listing order
	 */
	order: null,

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

	ui: {
		'order': '[data-role="order"] li',
		'loading': "div[data-role='loading']",
		'select': '#selection_all',
		'action': '[data-role="action"]',
		'action-main': '[data-role="bulk-action"]',
		'row-select': 'input[name="selection"]',
		'select-all': '[data-role="select-all"]',
		'counter': '[data-role="counter"]'
	},

	events: {
		'click @ui.order': 'changeOrder',
		'click @ui.select': 'selectAll',
		'click @ui.action': 'onAction',
		'hidden.bs.dropdown .btn-group': 'onHiddenDropDown',
		'click @ui.row-select': 'selectRow'
	},

	/**
	 * Triggered when a new order is selected
	 *
	 * @param {Event} event
	 */
	changeOrder: function(event) {
		var id = Backbone.$(event.currentTarget).data('id');
		var order = this.getOption('order');

		if (id >= order.length) return;
		var o = order[id];

		if (o.is_active) {
			// already active
			return;
		}

		Backbone.$.each(order, function() {
			this.is_active = this == o;
		});

		this.render();
		this.collection.fetch({
			data: o.data
		});
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'rowView', 'newRowView']);

		this.listenTo(this.getOption('collection'), 'request', this.onCollectionRequest);
		this.listenTo(this.getOption('collection'), 'sync', this.onCollectionSync);
		this.listenTo(this.getOption('collection'), 'sync update', this.selectRow);
	},

	onCollectionRequest: function(event, xhr, options) {
		if (!event.models) return; // not a collection event
		this.getUI('loading').show();
	},

	onCollectionSync: function(event) {
		this.getUI('loading').hide();
	},

	templateContext: function() {
		return {
			title: this.getOption('title'),
			order: this.getOption('order'),
			filterModal: this.getOption('filterModal'),
			selection: this.getOption('selection')
		};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			childView: this.rowView,
			childViewOptions: this.getOption('childViewOptions')
		}));
		if (this.getOption('filters').length > 0) {
			this.showChildView('filters', new FiltersView({
				filters: this.getOption('filters')
			}));
		}
		if (this.newRowView != null) {

			var options = _.extend({
				collection: this.collection
			}, this.getOption('childViewOptions'));

			this.showChildView('new', new this.newRowView(options));
		}
	},

	/**
	 * Update counter text
	 *
	 * @param {String} text
	 */
	setCounterText: function(text) {
		this.getUI('counter').text(text);
	},

	selectRow: function() {

		var checked = Backbone.$('input[name="selection"]:checked', this.el).length;
		var total = Backbone.$('input[name="selection"]', this.el).length;

		// Affichage du bouton d'actions groupées et compteur de sélection
		if (checked > 0) {
			this.getUI('action-main').parent().removeClass('hidden');
			this.getUI('select-all').addClass('hidden');
			this.setCounterText(' : ' + checked + (checked > 1 ? ' sélectionnés' : ' sélectionné'));
		} else {
			this.getUI('action-main').parent().addClass('hidden');
			this.getUI('select-all').removeClass('hidden');
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

	onChildviewFilterChange: function(filter) {
		// Pass to parent view !
		this.triggerMethod('filter:change', filter);
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
