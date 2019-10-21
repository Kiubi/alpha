var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/customers.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			plural: format.plural,
			creation_date: format.formatLongDate(this.model.get('creation_date'))
		};
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/customers.html'),
	className: 'container-fluid',
	service: 'customers',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-date',

	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'groups']);

		this.filters = {
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
		};
	},

	onRender: function() {

		var addFilters = new CollectionUtils.SelectCollection([{
			'value': 'email',
			'label': 'Email'
		}, {
			'value': 'enabled',
			'label': 'Accès'
		}, {
			'value': 'creation',
			'label': "Date d'inscription"
		}, {
			'value': 'mailinglist',
			'label': 'Abonné newsletter'
		}, {
			'value': 'order',
			'label': 'Nombre de commandes'
		}, {
			'value': 'revenues',
			'label': "Chiffre d'affaire"
		}]);
		if (this.getOption('enableExtranet')) {
			addFilters.add({
				'value': 'group',
				'label': 'Groupe extranet'
			});
		}

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Tous les membres',
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export',
					'label': 'Exporter les membres',
					'selected': false
				}])
			}, {
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Nom',
					selected: false,
					value: 'name'
				}, {
					label: 'Inscription',
					selected: true,
					value: '-date'
				}])
			}],
			selection: [{
				title: 'Autoriser',
				callback: this.enableCustomer.bind(this)
			}, {
				title: 'Bloquer',
				callback: this.disableCustomer.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteCustomer.bind(this),
				confirm: true
			}],
			filters: [{
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}, {
				id: 'add',
				title: 'Ajouter un filtre',
				extraClassname: 'filter-add',
				type: 'dropdown',
				disableLabelUpdate: true,
				collectionPromise: addFilters
			}]
		}));
	},

	start: function() {

		var data = {
			sort: this.sortOrder ? this.sortOrder : null,
			extra_fields: 'orders'
		};
		if (this.filters.term != null) data.term = this.filters.term;
		if (this.filters.email != null) data.email = this.filters.email;
		if (this.filters.is_enabled != null) data.is_enabled = this.filters.is_enabled;
		if (this.filters.creation_date != null) {
			data.creation_date_min = this.filters.creation_date[0];
			data.creation_date_max = this.filters.creation_date[1];
		}
		if (this.filters.is_in_mailinglist != null) data.is_in_mailinglist = this.filters.is_in_mailinglist;
		if (this.filters.group_id != null) data.group_id = this.filters.group_id;
		if (this.filters.order_count != null) {
			data.order_count_min = this.filters.order_count[0];
			data.order_count_max = this.filters.order_count[1];
		}
		if (this.filters.order_revenues != null) {
			data.order_revenues_min = this.filters.order_revenues[0];
			data.order_revenues_max = this.filters.order_revenues[1];
		}

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	enableCustomer: function(ids) {
		return this.collection.bulkEnable(ids);
	},

	disableCustomer: function(ids) {
		return this.collection.bulkDisable(ids);
	},

	deleteCustomer: function(ids) {
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

	onExportFilterChange: function(filter) {
		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export') {

			if (view.collection.length > 1) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {};
			if (this.filters.term != null) data.term = this.filters.term;
			if (this.filters.email != null) data.email = this.filters.email;
			if (this.filters.is_enabled != null) data.is_enabled = this.filters.is_enabled;
			if (this.filters.creation_date != null) {
				data.creation_date_min = this.filters.creation_date[0];
				data.creation_date_max = this.filters.creation_date[1];
			}
			if (this.filters.is_in_mailinglist != null) data.is_in_mailinglist = this.filters.is_in_mailinglist;
			if (this.filters.group_id != null) data.group_id = this.filters.group_id;
			if (this.filters.order_count != null) {
				data.order_count_min = this.filters.order_count[0];
				data.order_count_max = this.filters.order_count[1];
			}
			if (this.filters.order_revenues != null) {
				data.order_revenues_min = this.filters.order_revenues[0];
				data.order_revenues_max = this.filters.order_revenues[1];
			}

			this.collection.exportAll(data).done(function(data) {
				view.overrideExtraClassname('');
				view.collection.add([{
					value: null,
					label: '---'
				}, {
					value: data.url,
					label: 'Télécharger le fichier',
					extraClassname: 'md-export'
				}]);
				view.toggleDropdown(); // open
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);

				view.overrideExtraClassname('');
				while (view.collection.length > 1) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 1) {
				view.collection.pop();
			}
		}
	},

	onEmailFilterChange: function(filter) {
		this.filters.email = filter.value;
		this.start();
	},

	onEnabledFilterChange: function(filter) {
		this.filters.is_enabled = filter.value;
		this.start();
	},

	onCreationFilterChange: function(filter) {
		this.filters.creation_date = filter.value;
		this.start();
	},

	onMailinglistFilterChange: function(filter) {
		this.filters.is_in_mailinglist = filter.value;
		this.start();
	},

	onGroupFilterChange: function(filter) {
		this.filters.group_id = filter.value;
		this.start();
	},

	onOrderFilterChange: function(filter) {
		this.filters.order_count = filter.value;
		this.start();
	},

	onRevenuesFilterChange: function(filter) {
		this.filters.order_revenues = filter.value;
		this.start();
	},

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	},

	onAddFilterChange: function(filter) {

		var cfg;
		switch (filter.value) {
			case 'email':
				cfg = {
					id: filter.value,
					title: 'Email',
					type: 'input',
					value: '',
					canDelete: true
				};
				break;
			case 'gender':
				cfg = {
					id: filter.value,
					title: 'Genre',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': 'W',
						'label': 'Femme'
					}, {
						'value': 'M',
						'label': 'Homme'
					}])
				};
				break;
			case 'enabled':
				cfg = {
					id: filter.value,
					title: 'Accès',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': true,
						'label': 'Actif'
					}, {
						'value': false,
						'label': 'Bloqué'
					}])
				};
				break;
			case 'creation':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Inscrit entre', 'et'],
					canDelete: true
				};
				break;
			case 'mailinglist':
				cfg = {
					id: filter.value,
					title: 'Newsletter',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': true,
						'label': 'Inscrit'
					}, {
						'value': false,
						'label': 'Désinscrit'
					}])
				};
				break;
			case 'group':
				cfg = {
					id: filter.value,
					title: 'Groupe extranet',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: this.groups.promisedSelect()
				};
				break;
			case 'order':
				cfg = {
					id: filter.value,
					title: 'nb de fois',
					type: 'interval',
					prependText: ['Commandé entre', 'et'],
					canDelete: true
				};
				break;
			case 'revenues':
				cfg = {
					id: filter.value,
					title: '',
					type: 'interval',
					prependText: ['CA entre', 'et'],
					canDelete: true
				};
				break;
			default:
				return;
		}

		filter.model.collection.add(cfg);
	}

});
