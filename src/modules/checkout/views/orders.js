var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
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

var ListView = require('kiubi/views/ui/list.js');

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

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.filters = {
			is_paid: null,
			status: this.getOption('filters') && this.getOption('filters').status ? this.getOption('filters').status : null,
			customer_id: this.getOption('customer_id') ? this.getOption('customer_id') : null,
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
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

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des commandes',
			order: [{
				title: 'Date',
				is_active: true,
				value: '-date'
			}, {
				title: 'Livraison/retrait',
				is_active: false,
				value: '-schedule'
			}, {
				title: 'Montant',
				is_active: false,
				value: '-amount'
			}, {
				title: 'Modification',
				is_active: false,
				value: '-modification'
			}],
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
					id: 'is_paid',
					title: 'Tous les status',
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': 'paid',
						'label': 'Payée',
						'selected': false
					}, {
						'value': 'unpaid',
						'label': 'À payer',
						'selected': false
					}])
				},
				{
					id: 'term',
					title: 'Rechercher',
					type: 'input',
					value: this.filters.term
				}
				/*, {
								id: 'delivery',
								title: 'Livraison',
								collectionPromise: new CollectionUtils.SelectCollection([{
									'value': 'delivery',
									'label': 'À livrer',
									'selected': false
								}, {
									'value': 'pickup',
									'label': 'À retirer',
									'selected': false
								}])
							}, {
								id: 'export',
								extraClassname: 'md-export',
								type: 'button',
								collectionPromise: new CollectionUtils.SelectCollection({
									'value': 'export',
									'label': 'Exporter les commandes',
									'selected': false
								})
							}*/
			]
		}));
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

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	},

	/* Filers */

	onChildviewFilterChange: function(filter) {
		switch (filter.model.get('id')) {
			case 'is_paid':
				this.onStatusFilterChange(filter);
				break;
				/*case 'delivery':
					this.onDeliveryFilterChange(filter);
					break;
				case 'export':
					this.onEportFilterChange(filter);
					break;*/
			case 'term':
				this.filters.term = filter.value != '' ? filter.value : null;
				break;
		}
		this.start();
	},

	onStatusFilterChange: function(filter) {
		if (filter.value == 'paid') {
			this.filters.is_paid = true;
		} else if (filter.value == 'unpaid') {
			this.filters.is_paid = false;
		} else {
			this.filters.is_paid = null;
		}
	}

	/*onDeliveryFilterChange: function(filter) {
		console.log('onDeliveryFilterChange TODO');

	},

	onEportFilterChange: function(filter) {
		console.log('onEportFilterChange TODO');

	}
*/
});
