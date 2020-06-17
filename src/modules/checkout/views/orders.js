var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/orders.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {

		var creation_date = moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss');
		var diff = moment().diff(creation_date, 'days');

		var creation_date_fromnow;
		if (diff >= 1) {
			creation_date_fromnow = format.formatLongDateTime(this.model.get('creation_date'));
		} else {
			creation_date_fromnow = creation_date.fromNow();
		}

		var shipping = this.model.get('shipping');
		var scheduled_date;

		if (shipping.scheduled) {
			scheduled_date = shipping.scheduled.indexOf(' ') === -1 ? format.formatDate(shipping.scheduled) : format.formatLongDateTime(
				shipping.scheduled);
		}

		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			creation_date_fromnow: creation_date_fromnow,
			scheduled_date: scheduled_date
		};
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/orders.html'),
	className: 'container-fluid',
	service: 'checkout',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-date',
	filters: null,
	hasAccounting: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'carriers', 'customers', 'payments', 'departments', 'hasAccounting']);
		this.filters = {
			is_paid: null,
			status: this.getOption('filters') && this.getOption('filters').status && this.getOption('filters').status != 'all' ? this.getOption('filters').status : null,
			customer_id: this.getOption('customer_id') ? this.getOption('customer_id') : null,
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null,
			payment_date: this.getOption('filters') && this.getOption('filters').payment_date_min && this.getOption('filters').payment_date_max ? [this.getOption('filters').payment_date_min, this.getOption('filters').payment_date_max] : null,
			creation_date: this.getOption('filters') && this.getOption('filters').creation_date_min && this.getOption('filters').creation_date_max ? [this.getOption('filters').creation_date_min, this.getOption('filters').creation_date_max] : null,
			department: this.getOption('filters') && this.getOption('filters').department ? this.getOption('filters').department : null
		};

		this.listenTo(this.collection, 'sync', function(model) {
			if (this.filters.status == null) return;

			if (!(model instanceof Backbone.Model)) { // could be a Backbone.Collection
				return;
			}

			if (model.get('status') != this.filters.status) {
				this.collection.remove(model);
			}
		}.bind(this));
	},

	onRender: function() {

		var exportActions = [{
			'value': 'export',
			'label': 'Exporter les commandes',
			'selected': false
		}, {
			'value': 'export-coliship',
			'label': 'Exporter pour Coliship',
			'selected': false
		}, {
			'value': 'export-dpd',
			'label': 'Exporter pour DPD',
			'selected': false
		}];

		if (this.hasAccounting) {
			exportActions.push({
				'value': 'export-accounting',
				'label': 'Export comptable',
				'selected': false
			});
		}

		var status = new CollectionUtils.SelectCollection([{
			'value': 'pending',
			'label': 'À traiter'
		}, {
			'value': 'processing',
			'label': 'En cours'
		}, {
			'value': 'processed',
			'label': 'Traitées'
		}, {
			'value': 'shipped',
			'label': 'Expédiées'
		}, {
			'value': 'cancelled',
			'label': 'Annulées'
		}, {
			'value': null,
			'label': 'Toutes les commandes'
		}]);
		var current = status.findWhere({
			value: this.filters.status
		});
		var view = new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des commandes',
			selection: [{
				title: 'Est À traiter',
				callback: this.changeStatusPending.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est En cours',
				callback: this.changeStatusProcessing.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est Traitée',
				callback: this.changeStatusProcessed.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est Expediée',
				callback: this.changeStatusShipped.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est Annulée',
				callback: this.changeStatusCancelled.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est Payée',
				callback: this.changePaid.bind(this),
				className: 'confirm-success',
				confirm: true
			}, {
				title: 'Est À payer',
				callback: this.changeUnpaid.bind(this),
				className: 'confirm-success',
				confirm: true
			}],
			filters: [{
				id: 'status',
				title: current ? current.get('label') : 'Tous les statuts',
				type: 'dropdown',
				collectionPromise: status
			}, {
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
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'paid',
					'label': 'Paiement'
				}, {
					'value': 'customer',
					'label': 'Acheteur'
				}, {
					'value': 'creation',
					'label': 'Date de création'
				}, {
					'value': 'price',
					'label': 'Montant'
				}, {
					'value': 'paymentDate',
					'label': 'Date de paiement'
				}, {
					'value': 'payment',
					'label': 'Mode de paiement'
				}, {
					'value': 'carrier',
					'label': 'Transporteur'
				}, {
					'value': 'fidelity',
					'label': 'Points de fidélités'
				}, {
					'value': 'department',
					'label': 'Département'
				}])
			}],
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection(exportActions)
			}, {
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Date',
					selected: true,
					value: '-date'
				}, {
					label: 'Livraison/retrait',
					selected: false,
					value: '-schedule'
				}, {
					label: 'Montant',
					selected: false,
					value: '-amount'
				}, {
					label: 'Modification',
					selected: false,
					value: '-modification'
				}])
			}]
		});
		this.showChildView('list', view);

		if (this.filters.payment_date != null) {
			view.showFilter('paymentDate');
		}

		if (this.filters.creation_date != null) {
			view.showFilter('creation');
		}

		if (this.filters.department != null) {
			view.showFilter('department');
		}

	},

	start: function() {
		var data = {
			sort: this.sortOrder ? this.sortOrder : null,
			extra_fields: 'price_label'
		};
		if (this.filters.status != null) data.status = this.filters.status;
		if (this.filters.is_paid != null) data.is_paid = this.filters.is_paid;
		if (this.filters.customer_id != null) data.customer_id = this.filters.customer_id;
		if (this.filters.term != null) data.term = this.filters.term;
		if (this.filters.creation_date != null) {
			data.creation_date_min = this.filters.creation_date[0];
			data.creation_date_max = this.filters.creation_date[1];
		}
		if (this.filters.price_total_inc_vat != null) {
			data.price_total_inc_vat_min = this.filters.price_total_inc_vat[0];
			data.price_total_inc_vat_max = this.filters.price_total_inc_vat[1];
		}
		if (this.filters.payment_date != null) {
			data.payment_date_min = this.filters.payment_date[0];
			data.payment_date_max = this.filters.payment_date[1];
		}
		if (this.filters.payment_id != null) data.payment_id = this.filters.payment_id;
		if (this.filters.carrier_id != null) data.carrier_id = this.filters.carrier_id;
		if (this.filters.fidelity_reward != null) {
			data.fidelity_reward_min = this.filters.fidelity_reward[0];
			data.fidelity_reward_max = this.filters.fidelity_reward[1];
		}
		if (this.filters.department != null) {
			data.country_id = 73; // Fr only
			data.department = this.filters.department;
		}

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	/* Actions */
	changePaid: function(ids) {
		return this.collection.bulkPaymentStatus(ids, true);
	},
	changeUnpaid: function(ids) {
		return this.collection.bulkPaymentStatus(ids, false);
	},
	changeStatusPending: function(ids) {
		return this.collection.bulkStatus(ids, 'pending');
	},
	changeStatusProcessing: function(ids) {
		return this.collection.bulkStatus(ids, 'processing');
	},
	changeStatusProcessed: function(ids) {
		return this.collection.bulkStatus(ids, 'processed');
	},
	changeStatusShipped: function(ids) {
		return this.collection.bulkStatus(ids, 'shipped');
	},
	changeStatusCancelled: function(ids) {
		return this.collection.bulkStatus(ids, 'cancelled');
	},

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onStatusFilterChange: function(filter) {
		this.filters.status = filter.value;
		this.start();
	},

	onPaidFilterChange: function(filter) {
		if (filter.value == 'paid') {
			this.filters.is_paid = true;
		} else if (filter.value == 'unpaid') {
			this.filters.is_paid = false;
		} else {
			this.filters.is_paid = null;
		}
		this.start();
	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();
	},

	onExportFilterChange: function(filter) {

		if (!filter.view) return;
		var view = filter.view;

		var max = 3;
		if (this.hasAccounting) {
			max++;
		}

		if (filter.value == 'export' || filter.value == 'export-coliship' || filter.value == 'export-dpd' || filter.value == 'export-accounting') {
			if (view.collection.length > max) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {};
			if (filter.value == 'export-coliship') data.type = 'coliship';
			else if (filter.value == 'export-accounting') data.type = 'accounting';
			else if (filter.value == 'export-dpd') data.type = 'dpd';

			if (this.filters.status != null) data.status = this.filters.status;
			if (this.filters.is_paid != null) data.is_paid = this.filters.is_paid;
			if (this.filters.term != null) data.term = this.filters.term;
			if (this.filters.customer_id != null) data.customer_id = this.filters.customer_id;
			if (this.filters.creation_date != null) {
				data.creation_date_min = this.filters.creation_date[0];
				data.creation_date_max = this.filters.creation_date[1];
			}
			if (this.filters.price_total_inc_vat != null) {
				data.price_total_inc_vat_min = this.filters.price_total_inc_vat[0];
				data.price_total_inc_vat_max = this.filters.price_total_inc_vat[1];
			}
			if (this.filters.payment_date != null) {
				data.payment_date_min = this.filters.payment_date[0];
				data.payment_date_max = this.filters.payment_date[1];
			}
			if (this.filters.payment_id != null) data.payment_id = this.filters.payment_id;
			if (this.filters.carrier_id != null) data.carrier_id = this.filters.carrier_id;
			if (this.filters.fidelity_reward != null) {
				data.fidelity_reward_min = this.filters.fidelity_reward[0];
				data.fidelity_reward_max = this.filters.fidelity_reward[1];
			}
			if (this.filters.department !== '' && this.filters.department != null) {
				data.country_id = 73; // Fr only
				data.department = this.filters.department;
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
				while (view.collection.length > max) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > max) {
				view.collection.pop();
			}
		}
	},

	onCustomerFilterChange: function(filter) {
		this.filters.customer_id = filter.value;
		this.start();
	},

	onCreationFilterChange: function(filter) {
		this.filters.creation_date = filter.value;
		this.start();
	},

	onPriceFilterChange: function(filter) {
		this.filters.price_total_inc_vat = filter.value;
		this.start();
	},

	onPaymentDateFilterChange: function(filter) {
		this.filters.payment_date = filter.value;
		this.start();
	},

	onPaymentFilterChange: function(filter) {
		this.filters.payment_id = filter.value;
		this.start();
	},

	onCarrierFilterChange: function(filter) {
		this.filters.carrier_id = filter.value;
		this.start();
	},

	onFidelityFilterChange: function(filter) {
		this.filters.fidelity_reward = filter.value;
		this.start();
	},

	onDepartmentFilterChange: function(filter) {
		this.filters.department = filter.value;
		this.start();
	},

	onAddFilterChange: function(filter) {
		var cfg;
		switch (filter.value) {
			case 'paid':
				cfg = {
					id: filter.value,
					title: 'Paiement',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': 'paid',
						'label': 'Payée'
					}, {
						'value': 'unpaid',
						'label': 'À payer'
					}])
				};
				break;
			case 'customer':
				cfg = {
					id: filter.value,
					title: 'Acheteur',
					type: 'search',
					canDelete: true
				};
				break;
			case 'creation':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Créée entre', 'et'],
					canDelete: true,
					value: this.filters.creation_date ? this.filters.creation_date : null
				};
				break;
			case 'price':
				cfg = {
					id: filter.value,
					title: 'prix TTC',
					type: 'interval',
					prependText: ['Montant entre', 'et'],
					canDelete: true
				};
				break;
			case 'paymentDate':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Payée entre', 'et'],
					canDelete: true,
					value: this.filters.payment_date ? this.filters.payment_date : null
				};
				break;
			case 'payment':
				cfg = {
					id: filter.value,
					title: 'Mode de paiement',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: this.payments.promisedSelect()
				};
				break;
			case 'carrier':
				cfg = {
					id: filter.value,
					title: 'Transporteur',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: this.carriers.promisedSelect()
				};
				break;
			case 'fidelity':
				cfg = {
					id: filter.value,
					title: '',
					type: 'interval',
					prependText: ['Pt de fidélités', 'et'],
					canDelete: true
				};
				break;
			case 'department':
				cfg = {
					id: filter.value,
					title: 'Département',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: this.departments.promisedSelect(this.filters.department)
				};
				break;
			default:
				return;
		}

		filter.model.collection.add(cfg);
	},

	onChildviewFilterInput: function(filter) {

		if (!filter.view || !filter.view.showResults) return;

		var exclude = filter.view.current.value ? [filter.view.current.value] : null;
		this.customers.suggest(filter.value, 5, exclude).done(function(customers) {
			var results = _.map(customers, function(customer) {
				return {
					label: customer.firstname + ' ' + customer.lastname,
					value: customer.customer_id
				};
			});

			filter.view.showResults(results);
		}.bind(this));
		return;
	}

});
