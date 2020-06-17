var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/tier_prices.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: format.plural
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/tier_prices.html'),
	className: 'container-fluid',
	service: 'modules',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: 'name',

	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.filters = {};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			enableQuota: true,

			title: 'Liste des grilles de tarifs dégressifs',
			selection: [{
				title: 'Activer',
				callback: this.enableVouchers.bind(this)
			}, {
				title: 'Désactiver',
				callback: this.disableVouchers.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteVouchers.bind(this),
				confirm: true
			}],
			filters: [{
				id: 'name',
				title: 'Rechercher',
				type: 'input',
				value: ''
			}, {
				id: 'add',
				title: 'Ajouter un filtre',
				extraClassname: 'filter-add',
				type: 'dropdown',
				disableLabelUpdate: true,
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'enabled',
					'label': 'État'
				}])
			}],
			xtra: [{
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Nom',
					selected: true,
					value: 'name'
				}, {
					label: 'Nombre de produits',
					selected: false,
					value: '-product_count'
				}])
			}]

		}));
	},

	start: function() {

		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.name != null) data.name = this.filters.name;
		if (this.filters.is_enabled != null) data.is_enabled = this.filters.is_enabled;

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	enableVouchers: function(ids) {
		return this.collection.bulkEnable(ids);
	},

	disableVouchers: function(ids) {
		return this.collection.bulkDisable(ids);
	},

	deleteVouchers: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onNameFilterChange: function(filter) {
		this.filters.name = filter.value !== '' ? filter.value : null;
		this.start();
	},

	onEnabledFilterChange: function(filter) {
		this.filters.is_enabled = filter.value;
		this.start();
	},

	onAddFilterChange: function(filter) {

		var cfg;
		switch (filter.value) {

			case 'enabled':
				cfg = {
					id: filter.value,
					title: 'État',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': true,
						'label': 'Actif'
					}, {
						'value': false,
						'label': 'Inactif'
					}])
				};
				break;

			default:
				return;
		}

		filter.model.collection.add(cfg);
	},

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	}

});
