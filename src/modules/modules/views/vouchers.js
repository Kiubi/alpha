var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/vouchers.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: format.plural,
			start_date: format.formatLongDate(this.model.get('start_date')),
			end_date: format.formatLongDate(this.model.get('end_date'))
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/vouchers.html'),
	className: 'container-fluid',
	service: 'modules',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-start_date',

	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.filters = {};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des bons de réduction',
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
				id: 'term',
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
						'value': 'type',
						'label': 'Type'
					}, {
						'value': 'enabled',
						'label': 'État'
					}, {
						'value': 'start',
						'label': "Date de début"
					},
					{
						'value': 'end',
						'label': "Date de fin"
					}, {
						'value': 'value',
						'label': 'Valeur'
					}
				])
			}],
			xtra: [{
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Date de validité',
					selected: true,
					value: '-start_date'
				}, {
					label: 'Code',
					selected: false,
					value: 'code'
				}])
			}]

		}));
	},

	start: function() {

		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.term != null) data.term = this.filters.term;
		if (this.filters.is_enabled != null) data.is_enabled = this.filters.is_enabled;
		if (this.filters.type != null) data.type = this.filters.type;
		if (this.filters.start_date != null) {
			data.start_date_min = this.filters.start_date[0];
			data.start_date_max = this.filters.start_date[1];
		}
		if (this.filters.end_date != null) {
			data.end_date_min = this.filters.end_date[0];
			data.end_date_max = this.filters.end_date[1];
		}
		if (this.filters.value != null) {
			data.value_min = this.filters.value[0];
			data.value_max = this.filters.value[1];
		}

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

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();
	},

	onTypeFilterChange: function(filter) {
		this.filters.type = filter.value != '' ? filter.value : null;
		this.start();
	},

	onEnabledFilterChange: function(filter) {
		this.filters.is_enabled = filter.value;
		this.start();
	},

	onValueFilterChange: function(filter) {
		this.filters.value = filter.value;
		this.start();
	},

	onStartFilterChange: function(filter) {
		this.filters.start_date = filter.value;
		this.start();
	},

	onEndFilterChange: function(filter) {
		this.filters.end_date = filter.value;
		this.start();
	},

	onAddFilterChange: function(filter) {

		var cfg;
		switch (filter.value) {

			case 'type':
				cfg = {
					id: filter.value,
					title: 'Type',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': 'amount',
						'label': 'Montant fixe'
					}, {
						'value': 'percent',
						'label': 'Pourcentage'
					}, {
						'value': 'shipping',
						'label': 'Frais de port'
					}])
				};
				break;
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
			case 'value':
				cfg = {
					id: filter.value,
					title: '',
					type: 'interval',
					prependText: ['Valeur entre', 'et'],
					canDelete: true
				};
				break;
			case 'start':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Commence entre', 'et'],
					canDelete: true
				};
				break;
			case 'end':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Termine entre', 'et'],
					canDelete: true
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
