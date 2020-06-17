var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');


/* Filtres */
var FilterBtnView = require('kiubi/core/views/ui/list/filter.btn.js');
var FilterSelectView = require('kiubi/core/views/ui/list/filter.select.js');
var FilterSearchView = require('kiubi/core/views/ui/list/filter.search.js');
var FilterInputView = require('kiubi/core/views/ui/list/filter.input.js');
var FilterDropdownView = require('kiubi/core/views/ui/list/filter.dropdown.js');
var FilterIntervalView = require('kiubi/core/views/ui/list/filter.interval.js');

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

/* Models */

var Contents = require('kiubi/modules/cms/models/contents');

var Zone = Backbone.Model.extend({
	idAttribute: 'zone',
	defaults: {
		zone: '',
		is_allowed: false,
		contents: null,
		showTitle: true
	}
});

var ZoneCollection = Backbone.Collection.extend({
	model: Zone
});

var cacheSortable;

/* Listing */

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty"><span class="md-icon md-empty mb-2"></span>Il n\'y a encore rien à afficher</span>'
	)
});

var EmptyZoneView = Marionette.View.extend({
	template: _.template(
		'<div class="zone-empty"><small>Créez puis glissez-déposez du contenu ici</small></div>'
	)
});

var ContentRowView = Marionette.View.extend({
	template: require('../templates/contents/row.html'),
	className: 'list-item sortable-item',

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	},

	templateContext: function() {

		var classType, linkEdit;

		switch (this.model.get('content')) {
			case 'post':
				classType = 'md-billet';
				if (this.model.get('post') && this.model.get('is_visible')) classType += ' tags-color-' + this.model.get('post').type_position;
				linkEdit = '/cms/contents/' + this.model.get('content_id');
				break;
			case 'component':
				classType = 'md-composant';
				linkEdit = '/cms/contents/' + this.model.get('content_id');
				break;
			case 'symbol':
				classType = 'md-symbole';
				linkEdit = '/cms/symbols/' + this.model.get('symbol').symbol_id;
				break;
		}

		return {
			classType: classType,
			linkEdit: linkEdit,
			typeName: this.model.getTypeName(),
			title: this.model.getTitle()
		};
	}

});


/**/

var ContentCollectionView = Marionette.CollectionView.extend({
	emptyView: EmptyZoneView,

	className: 'sortable-content',

	proxy: null,

	onAddChild: function(collectionView, rowView) {
		if (rowView.model) rowView.$el.attr('data-id', rowView.model.id);
	},

	initialize: function(options) {
		this.mergeOptions(options, ['proxy']);
	},

	onRender: function() {
		var scrollfix = 0;

		var proxy = this.proxy;

		var params = {
			handle: ".btn-drag",
			axis: "y",
			//snap: true

			connectWith: '.contents-list .sortable-allowed div.ui-sortable',
			//placeholder: 'add-zone',
			tolerance: 'pointer',
			start: function(event, ui) {
				cacheSortable = {
					content_id: Backbone.$(ui.item).data('id'),
					zone: Backbone.$(this).data('zone'),
					zoneEl: Backbone.$(this),
					position: null
				};

				if (Backbone.$(this).data('sortableFirst') != true) {
					scrollfix = Backbone.$('#content').scrollTop();
				} else {
					scrollfix = 0;
				}
				Backbone.$(this).data('sortableFirst', true);
			},
			sort: function(event, ui) {
				if (scrollfix > 0) {
					ui.helper.css({
						'top': ui.position.top - scrollfix + 'px'
					});
				}
			},
			receive: function(event, ui) {
				cacheSortable.zone = Backbone.$(this).data('zone');
				cacheSortable.zoneEl = Backbone.$(this);
			},
			stop: function(event, ui) {
				cacheSortable.position = Backbone.$('.sortable-item', cacheSortable.zoneEl).index(ui.item); // exclude empty zone
				proxy.onContentMove(cacheSortable.content_id, cacheSortable.zone, cacheSortable.position);
			},
			change: function(event, ui) {
				scrollfix = 0;
			}

		};

		Backbone.$(this.el).sortable(params);
	}

});

var ZoneView = Marionette.View.extend({

	template: require('../templates/contents/zone.html'),

	className: 'post-content post-list',
	// className: list-item-zone

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options);
	},

	onRender: function() {

		if (this.model.get('is_allowed')) {
			this.$el.removeClass('sortable-denied');
			this.$el.addClass('sortable-allowed');
		} else {
			this.$el.removeClass('sortable-allowed');
			this.$el.addClass('sortable-denied');
		}

		var view = new ContentCollectionView({
			collection: this.model.get('contents'),
			childView: ContentRowView,
			proxy: this.getOption('proxy')
		});

		this.showChildView('list', view);

		view.$el.data('zone', this.model.get('zone')); // assign zone

	}

});

var ZoneCollectionView = Marionette.CollectionView.extend({
	emptyView: NoChildrenView,

	childView: ZoneView,

	className: 'contents-list',

	buildChildView: function(child, ChildViewClass, childViewOptions) {

		// build the final list of options for the childView class
		var options = _.extend({
			model: child
		}, childViewOptions);
		var view = new ChildViewClass(options);
		return view;
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

	zones: null,
	enableZones: true,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'zoneList', 'enableZones']);

		this.listenTo(this.getOption('collection'), 'request', this.onCollectionRequest);
		this.listenTo(this.getOption('collection'), 'sync', this.onCollectionSync);
		this.listenTo(this.getOption('collection'), 'sync update', this.selectRow);

		this.zones = new ZoneCollection();

		if (this.enableZones) {
			if (this.zoneList) {
				// preload zones
				_.each(this.zoneList, function(zone) {
					this.addZone(zone.id, true);
				}.bind(this));
			}
		} else {
			this.addZone('', true);
		}

		// Remove model from zone collection
		this.listenTo(this.collection, 'remove', function(model) {
			this.zones.each(function(zone) {
				zone.get('contents').remove(model);
			});
		}.bind(this));

		this.listenTo(this.collection, 'sync', function(collectionOrModel, payload) {
			if (!collectionOrModel.model) return; // exclude model events
			_.each(payload.data, function(content) {
				this.addContent(
					this.collection.get(content.content_id)
				);
			}.bind(this));
			this.collection.fetchNext();
		});

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

	resetZones: function(zones) {
		this.zones.reset();

		if (this.enableZones) {
			if (zones) {
				// preload zones
				_.each(zones, function(zone) {
					this.addZone(zone.id, true);
				}.bind(this));
			}
		} else {
			this.addZone('', true);
		}

		this.collection.each(function(model) {
			this.addContent(
				model
			);
		}.bind(this));

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
			proxy: this,
			childRowView: this.rowView
		}, this.getOption('childViewOptions'));
		this.showChildView('list', new ZoneCollectionView({
			collection: this.zones,
			childViewOptions: childViewOptions
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

		if (this.newRowView !== null) {

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

	/** Zone manipulation **/

	addZone: function(zone, is_allowed) {
		return this.zones.add({
			zone: zone,
			is_allowed: is_allowed,
			contents: new Contents(),
			showTitle: this.enableZones
		});
	},

	addContent: function(content) {
		var zone;
		if (this.enableZones) {
			zone = this.zones.find({
				zone: content.get('zone')
			});
			if (!zone) {
				zone = this.addZone(content.get('zone'), false);
			}
		} else {
			zone = this.zones.at(0);
		}
		zone.get('contents').add(content);
	},

	onContentMove: function(content_id, dest_zone, position) {

		var destZone = this.zones.find({
			zone: dest_zone
		});
		var content = null;
		this.zones.each(function(zone) {
			if (content) return; // skip later searches
			content = zone.get('contents').find({
				content_id: content_id
			});
			if (content) {
				zone.get('contents').remove(content);
				destZone.get('contents').add(content, {
					at: position
				});
			}
		});

		this.collection.reOrder(dest_zone, destZone.get('contents').reduce(function(acc, model) {
			acc.push(model.get('content_id'));
			return acc;
		}, []));

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

	addChildView: function(view, index) {
		return this.getChildView('list').addChildView(view, index);
	},

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
