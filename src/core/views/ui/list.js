var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var CollectionUtils = require('kiubi/utils/collections.js');
var InfiniteScrollBehavior = require('kiubi/behaviors/infinite_scroll.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');

/* Filtres */

var filterCollection = Backbone.Collection.extend({
	model: Backbone.Model.extend({
		defaults: {
			id: null,
			title: '',
			type: 'select',
			extraClassname: '', // FilterBtnView
			collectionPromise: null, // FilterBtnView, FilterSelectView
			collection: null,
			value: null // FilterInputView
		}
	})
});

var FilterBtnView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.btn.html'),

	className: 'btn-group',

	ui: {
		'dropdown': '[data-toggle="dropdown"]'
	},

	events: {
		'click button': 'onButtonChange',
		'click li a': 'onSelectChange'
	},

	oClassname: '',

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);

		if (!this.model.get('collectionPromise')) {
			this.setCollection(new CollectionUtils.SelectCollection());
			return;
		}

		// Test if collectionPromise is a promise or a collection
		// No .then() => Collection. Meh ! Close enough...
		if (this.model.get('collectionPromise').then) {
			this.model.get('collectionPromise').done(function(collection) {
				this.setCollection(collection);
				this.render();
			}.bind(this));
		} else {
			this.setCollection(this.model.get('collectionPromise'));
		}

	},

	setCollection: function(collection) {
		this.collection = collection;
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'reset', this.render);
	},

	overrideExtraClassname: function(classnames) {
		this.oClassname = classnames;
	},

	templateContext: function() {
		return {
			extraClassname: this.oClassname ? this.oClassname : this.model.get('extraClassname'),
			collection: this.collection.toJSON()
		};
	},

	/* DropDown */

	toggleDropdown: function() {
		this.getUI('dropdown').dropdown('toggle');
	},

	/* Events */

	onRender: function() {
		this.getUI('dropdown').dropdown();
	},

	onButtonChange: function(event) {
		this.proxy.triggerMethod('filter:change', {
			index: this.model.collection.indexOf(this.model),
			model: this.model,
			value: null,
			view: this
		});

		event.stopPropagation(); // needed
		event.preventDefault(); // needed
		return false;
	},

	onSelectChange: function(event) {
		var $link = Backbone.$(event.currentTarget, this.el);

		this.proxy.triggerMethod('filter:change', {
			index: this.model.collection.indexOf(this.model),
			model: this.model,
			value: $link.data('value'),
			view: this
		});
	}

});

var FilterSelectView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.select.html'),

	className: 'btn-group',

	behaviors: [SelectifyBehavior],

	events: {
		'change select': 'onSelectChange'
	},

	collection: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);

		if (!this.model.get('collectionPromise')) return;

		// Test if collectionPromise is a promise or a collection
		// No .then() => Collection. Meh ! Close enough...
		if (this.model.get('collectionPromise').then) {
			this.model.get('collectionPromise').done(function(collection) {
				this.collection = collection;
				this.render();
			}.bind(this));
		} else {
			this.collection = this.model.get('collectionPromise');
		}

	},

	templateContext: function() {
		return {
			collection: this.collection ? this.collection.toJSON() : null,
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

	onSelectChange: function(event) {
		var $select = Backbone.$(event.currentTarget, this.el);

		this.proxy.triggerMethod('filter:change', {
			index: this.model.collection.indexOf(this.model),
			model: this.model,
			value: $select.val(),
			view: this
		});
	}

});

var FilterSearchView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.search.html'),

	tagName: 'div',
	className: 'btn-group dropdown',

	ui: {
		'label': 'span[data-role="label"]',
		'li': 'li[data-role="selection"]',
		'clear': 'span[data-role="clear"]',
		'input': 'input[data-role="input"]',
		'dropdown-menu': '.dropdown-menu',
		'toggle': '.dropdown-toggle'
	},

	/**
	 * change : {label, value}
	 * input : term, view
	 */
	events: {

		'shown.bs.dropdown': function(event) {
			this.getUI('input').focus();
			this.triggerInput();
		},

		'click @ui.li': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));

			if (isNaN(index) || index > this.suggestions.length) return;

			this.setCurrent(this.suggestions[index]);

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: this.current.value,
				view: this
			});
		},

		'keyup @ui.input': _.debounce(function() {
			this.triggerInput();
		}, 300),

		'click @ui.clear': function(event) {

			if (this.current.value == null) return;

			event.preventDefault();

			this.setCurrent({
				label: this.model.get('title'),
				value: null
			});

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});

			return false;
		}
	},

	term: null,
	current: {
		label: '',
		value: null
	},
	suggestions: null,
	searchPlaceholder: 'Rechercher',

	initialize: function(options) {
		this.term = null;
		this.mergeOptions(options, ['model', 'proxy']);
		this.current = {
			label: this.model.get('title'),
			value: null
		};
	},

	templateContext: function() {
		return {
			'term': this.term,
			'searchPlaceholder': this.searchPlaceholder,
			'current': this.current
		};
	},

	triggerInput: function() {
		if (this.getUI('input').val() === this.term) return;
		this.term = this.getUI('input').val();

		this.proxy.triggerMethod('filter:input', {
			model: this.model,
			value: this.term,
			view: this
		});
	},

	/**
	 *
	 * @param {Object} current :
	 * 					{Number} value
	 * 					{String} label
	 */
	setCurrent: function(current) {
		this.current = current;
		this.getUI('label').text(current.label || '');

		if (this.current.value == null) {
			this.getUI('clear').removeClass('md-cancel');
			this.getUI('toggle').removeClass('cancel');
		} else {
			this.getUI('clear').addClass('md-cancel');
			this.getUI('toggle').addClass('cancel');
		}

	},

	/**
	 *
	 * @param {Array} results
	 * @param {Object} xtra
	 * 					{String} title
	 * 					{String} iconClass
	 * 					{String} eventName
	 */
	showResults: function(results, xtra) {
		this.suggestions = results;

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(memo, result, index) {
				return memo + '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' +
					result.label + '</a></li>';
			}, '<li class="dropdown-divider"></li>');
		} else {
			list =
				'<li class="dropdown-divider"></li><li><span class="dropdown-item dropdown-item-empty"><span class="md-icon md-no-result"></span> Aucun résultat</span></li>';
		}

		this.emptyList(this.getUI('dropdown-menu')).append(list);
		this.getUI('input').focus();
	},

	emptyList: function($dropdown) {
		var $first = $dropdown.children().eq(0).detach();
		return $dropdown.empty().append($first);
	}

});

var FilterInputView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.input.html'),

	className: 'btn-group has-feedback',

	ui: {
		'term': 'input[name="term"]'
	},

	currentTerm: '',

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			var term = this.getUI('term').val();
			if (term == this.currentTerm) {
				return;
			}
			this.currentTerm = term;
			this.onInputChange(term);
		}, 300)
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.currentTerm = this.model.get('value') ? this.model.get('value') : '';
	},

	/* Events */

	onInputChange: function(term) {
		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: term,
			view: this
		});
	}

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
		return 'post-content post-list ' + this.getOption('extraListClassname');
	},
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
	scrollContentEl: null,

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

	initialize: function(options) {
		this.mergeOptions(options, ['rowView', 'newRowView']);

		this.listenTo(this.getOption('collection'), 'request', this.onCollectionRequest);
		this.listenTo(this.getOption('collection'), 'sync', this.onCollectionSync);
		this.listenTo(this.getOption('collection'), 'sync update', this.selectRow);
	},

	templateContext: function() {
		return {
			title: this.getOption('title'),
			order: this.getOption('order'),
			filterModal: this.getOption('filterModal'),
			selection: this.getOption('selection'),
			extraClassname: this.getOption('extraClassname')
		};
	},

	getChildren: function() {
		return this.getChildView('list').children;
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
			extraListClassname: this.getOption('extraListClassname')
		}));

		if (this.getOption('filters').length > 0) {

			this.showChildView('filters', new FiltersView({
				collection: new filterCollection(this.getOption('filters')),
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

	/** Order events **/

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

		this.getUI('order').each(function() {
			var $li = Backbone.$(this);
			if ($li.data('id') == id) {
				$li.addClass('active');
			} else {
				$li.removeClass('active');
			}
		});

		this.triggerMethod('change:order', o.value);
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
