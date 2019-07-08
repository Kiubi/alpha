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
			extraClassname: '', // FilterBtnView, FilterDropdownView, FilterInputView, FilterIntervalView
			collectionPromise: null, // FilterBtnView, FilterSelectView, FilterDropdownView
			canDelete: false, // FilterInputView, FilterDropdownView, FilterIntervalView, FilterSearchView
			// value: null, // FilterInputView
			// prependText: '', // FilterInputView
			// disableLabelUpdate: '', // FilterDropdownView
			// enableDatepicker: '', // FilterIntervalView
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

	activeItem: function(value) {
		this.collection.each(function(model) {
			model.set('selected', (model.get('value') == value));
		});
		this.collection.trigger('update');
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

		// Disable select if already selected
		if ($link.parent().hasClass('active')) {
			return;
		}

		this.proxy.triggerMethod('filter:change', {
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

		this.collection = null;

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
		'feedback': 'span[data-role="feedback"]',
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

		'click @ui.feedback': function(event) {

			if (this.model.get('canDelete')) {
				this.proxy.triggerMethod('filter:change', {
					model: this.model,
					value: null,
					view: this
				});
				this.model.collection.remove(this.model);
				return;
			}

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
			this.getUI('feedback').removeClass('md-cancel');
			this.getUI('toggle').removeClass('reset-toogle');
		} else {
			this.getUI('feedback').addClass('md-cancel');
			this.getUI('toggle').addClass('reset-toogle');
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
		'term': 'input[name="term"]',
		'feedback': '[data-role="feedback"]'
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
		}, 300),
		'click @ui.feedback': function() {
			if (!this.model.get('canDelete')) return;

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});
			this.model.collection.remove(this.model);
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.currentTerm = this.model.get('value') ? this.model.get('value') : '';
	},

	templateContext: function() {

		var defaultClassname = this.model.get('canDelete') ? 'md-cancel' : 'md-search';

		return {
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : defaultClassname,
			prependText: this.model.get('prependText') ? this.model.get('prependText') : ''
		};
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

var FilterDropdownView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.dropdown.html'),

	className: 'btn-group',

	ui: {
		'li': 'li a',
		'label': '[data-role="label"]',
		'feedback': '[data-role="feedback"]'
	},

	events: {
		'click li a': 'onSelect',
		'click @ui.feedback': function() {
			if (!this.model.get('canDelete')) return;

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});
			this.model.collection.remove(this.model);
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.collection = null;

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
		var selected = this.collection ? this.collection.find({
			selected: true
		}) : null;
		return {
			title: selected ? selected.get('label') : this.model.get('title'),
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : '',
			collection: this.collection ? this.collection.toJSON() : null
		};
	},

	/* Events */

	onSelect: function(event) {

		var index = Backbone.$(event.currentTarget, this.el).data('index');

		if (index >= this.collection.length) return;

		if (!this.model.get('disableLabelUpdate')) {
			this.getUI('label').text(this.collection.at(index).get('label'));
		}

		this.proxy.triggerMethod('filter:change', {
			index: index,
			model: this.model,
			value: this.collection.at(index).get('value'),
			view: this
		});
	}

});

var FilterIntervalView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list.filter.interval.html'),

	className: 'btn-group',

	ui: {
		'term': 'input',
		'feedback': '[data-role="feedback"]'
	},

	currentTerm: '',

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			this.onInputChange(e);
		}, 300),
		'click @ui.feedback': function() {
			if (!this.model.get('canDelete')) return;

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});
			this.model.collection.remove(this.model);
		},
		'dp.change @ui.term': 'onInputChange'
	},

	min: '',
	max: '',

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.min = '';
		this.max = '';
	},

	templateContext: function() {

		var defaultClassname = this.model.get('canDelete') ? 'md-cancel' : 'md-search';

		return {
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : defaultClassname,
			prependText: this.model.get('prependText') ? this.model.get('prependText') : ['', '']
		};
	},

	onRender: function() {

		if (this.model.get('enableDatepicker')) { // date or datetime

			var options = {
				format: this.model.get('enableDatepicker') == 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss',
				showTodayButton: true,
				widgetPositioning: {
					horizontal: 'auto',
					vertical: 'bottom'
				},
				icons: {
					time: 'md-icon md-time',
					date: 'md-icon md-date',
					up: 'md-icon md-up',
					down: 'md-icon md-down',
					previous: 'md-icon md-previous',
					next: 'md-icon md-next',
					today: 'md-icon md-fixed',
					clear: 'md-icon md-delete',
					close: 'md-icon md-close'
				},
				tooltips: {
					today: 'Aujourd\'hui',
					clear: 'Recommencer',
					close: 'Fermer',
					selectMonth: 'Choisir un mois',
					prevMonth: 'Mois précédent',
					nextMonth: 'Mois suivant',
					selectYear: 'Choisir une année',
					prevYear: 'Année précédente',
					nextYear: 'Année suivante',
					selectDecade: 'Choisir une décennie',
					prevDecade: 'Décennie précédente',
					nextDecade: 'Décennie suivante',
					prevCentury: 'Siècle précédent',
					nextCentury: 'Siècle suivant',
					incrementHour: 'Heure suivante',
					pickHour: 'Choisir une heure',
					decrementHour: 'Heure précédente',
					incrementMinute: 'Minute suivante',
					pickMinute: 'Choisir une minute',
					decrementMinute: 'Minute précédente',
					incrementSecond: 'Seconde précédente',
					pickSecond: 'Choisir une seconde',
					decrementSecond: 'Seconde suivante',
					togglePeriod: 'Changer de période',
					selectTime: 'Choisir l\'heure'
				}
			};

			this.getUI('term').datetimepicker(options);
		}
	},

	/* Events */

	onInputChange: function(event) {

		if (event.currentTarget.name == 'min') {
			if (this.min == event.currentTarget.value) return;
			this.min = event.currentTarget.value;
		} else if (event.currentTarget.name == 'max') {
			if (this.max == event.currentTarget.value) return;
			this.max = event.currentTarget.value;
		}

		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: [this.min, this.max],
			view: this
		});
	},

	/**
	 * Clean up
	 */
	onBeforeDestroy: function() {
		if (this.model.get('enableDatepicker')) this.getUI('term').data("DateTimePicker").destroy();
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
		return 'post-content post-list '+ extra;
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
		
		if(this.getOption('fixRelativeDragNDrop')) {
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
