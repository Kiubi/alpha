var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var Forms = require('kiubi/utils/forms.js');
var CollectionUtils = require('kiubi/utils/collections.js');
var AddressEditModalView = require('./modal.address.edit');

var FormBehavior = require('kiubi/behaviors/simple_form.js');

var DropdownView = Marionette.View.extend({

	className: 'fake-select dropdown',

	template: _.template(
		'<button type="button" class="badge badge-lg dropdown-toggle" data-toggle="dropdown"><span class="fake-selected"><%- label %></span></button>' +
		'<ul class="dropdown-menu dropdown-control">' +
		'<% _.each(options, function(option, index){ %><li class="<%- option.selected ? \'active\' : \'\' %>"><a class="dropdown-item" data-index="<%- index %>" href="#"><%- option.label %></a></li><% }) %>' +
		'</ul>' +
		'<% if(name) { %><input type="hidden" name="<%- name %>" value="<%- value %>"><% } %>'
	),

	ui: {
		'options': '[data-index]',
		'button': 'button'
	},

	events: {
		'click @ui.options': function(event) {
			var selected = this.collection.selectIndex(Backbone.$(event.currentTarget).data('index'));
			if (selected) {
				this.trigger('select', selected);
			}
		}
	},

	collection: null,

	/**
	 *
	 * @param {Object} options : {
	 *     defaultLabel: String, // Default label (if no selected)
	 *     defaultValue: String, // Default value (if no selected)
	 *     name: String // input name
	 * }
	 */
	initialize: function(options) {
		this.mergeOptions(options);

		this.collection = new CollectionUtils.SelectCollection();

		this.listenTo(this.collection, 'update', this.render);
	},

	templateContext: function() {

		var selected = this.collection.selected();
		var label = (selected) ? selected.get('label') : this.getOption('defaultLabel') || '';
		var value = (selected) ? selected.get('value') : this.getOption('defaultValue') || '';

		return {
			label: label,
			value: value,
			name: this.getOption('name'),
			selected: selected,
			options: this.collection.toJSON()
		};
	},

	/**
	 *
	 * @returns {Backbone.Collection}
	 */
	getOptions: function() {
		return this.collection;
	},

	/**
	 *
	 * @returns {Backbone.Model|null}
	 */
	getSelected: function() {
		return this.collection.selected();
	}

});

var ActivityView = Marionette.View.extend({

	template: _.template(
		'<% _.each(activity, function(item){ %> <p><%= nl2br(item.message) %><br/> le <%- item.date_format %> <% if(item.user) { %> <br/> par <%- item.user %> <% } %></p><%}) %>'
	),

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	templateContext: function() {
		var activities = _.map(this.model.get('activity'), function(activity) {
			activity.date_format = format.formatLongDateTime(activity.date);
			return activity;
		});

		return {
			activity: activities,
			nl2br: function(text) {
				return _.escape('' + text).replace(/(\r\n|\n\r|\r|\n)+/g, '<br />');
			}
		};
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/order.html'),
	className: 'container container-large',
	service: 'checkout',

	behaviors: [FormBehavior],

	ui: {
		'notify': 'div[data-role="notify"]',
		'addressEdit': 'a[data-role="addressEdit"]'
	},

	events: {
		'click @ui.addressEdit': function(event) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			var type = Backbone.$(event.currentTarget).data('type');
			var contentView = new AddressEditModalView({
				model: this.model,
				type: type
			});
			navigationController.showInModal(contentView, {
				title: 'Modifier l\'adresse',
				modalClass: 'modal-right',
				modalDialogClass: 'modal-sm',
				action: {
					title: 'Enregistrer'
				}
			});
		}
	},

	regions: {
		'activity': {
			el: 'div[data-role="activity"]',
			replaceElement: true
		},
		'is_paid': {
			el: 'div[data-role="is_paid"]',
			replaceElement: true
		},
		'status': {
			el: 'div[data-role="status"]',
			replaceElement: true
		}
	},

	fields: [
		'comment',
		'picking_number',
		'notify',
		'is_paid',
		'status'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.listenTo(this.model, 'sync', this.render);

	},

	templateContext: function() {

		var google_maps = 'https://maps.google.fr/maps?h=q&hl=fr&q=';
		if (this.model.get('shipping_address')) {
			var shipping_address = this.model.get('shipping_address');
			shipping_address.map = google_maps +
				shipping_address.address + ' ' +
				shipping_address.zipcode + ' ' +
				shipping_address.city + ' ' +
				shipping_address.country;

			switch (shipping_address.civility) {
				case 'Mr':
					shipping_address._civility = 'M.';
					break;
				case 'Mrs':
					shipping_address._civility = 'Mme.';
					break;
				case 'Miss':
					shipping_address._civility = 'Mlle.';
					break;
				default:
					shipping_address._civility = '';
					break;
			}

		}
		if (this.model.get('billing_address')) {
			var billing_address = this.model.get('billing_address');
			billing_address.map = google_maps +
				billing_address.address + ' ' +
				billing_address.zipcode + ' ' +
				billing_address.city + ' ' +
				billing_address.country;

			switch (billing_address.civility) {
				case 'Mr':
					billing_address._civility = 'M.';
					break;
				case 'Mrs':
					billing_address._civility = 'Mme.';
					break;
				case 'Miss':
					billing_address._civility = 'Mlle.';
					break;
				default:
					billing_address._civility = '';
					break;
			}

		}

		var shipping = this.model.get('shipping');
		var scheduled_date;
		if (shipping.scheduled) {
			scheduled_date = shipping.scheduled.indexOf(' ') === -1 ? format.formatLongDate(shipping.scheduled) : format.formatLongDateTime(
				shipping.scheduled);
		}

		var voucher_label = '';
		if (this.model.get('voucher') && this.model.get('voucher').type) {
			// "amount" vouchers are already included in  this.model.get('items')
			switch (this.model.get('voucher').type) {
				case 'shipping':
					voucher_label = 'Frais de port fixes';
					break;
				case 'percent':
					voucher_label = 'Remise de ' + this.model.get('voucher').amount + '%';
					break;
			}
		}

		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			voucher_label: voucher_label,
			scheduled_date: scheduled_date
		};
	},

	onRender: function() {
		this.showChildView('activity', new ActivityView({
			model: this.model
		}));

		var paidView = new DropdownView({
			name: 'is_paid'
		});
		this.listenTo(paidView, 'render', function(view) {
			var selected = view.getSelected();
			if (selected) {
				view.getUI('button').addClass(selected.get('badge'));
			}
		}.bind(this));
		this.listenTo(paidView, 'select', function() {
			this.triggerMethod('field:change');
		}.bind(this));
		paidView.getOptions().add([{
			'value': 0,
			'label': 'À payer',
			'badge': 'badge-warning',
			'selected': !this.model.get('is_paid')
		}, {
			'value': 1,
			'label': 'Payée',
			'badge': 'badge-success',
			'selected': this.model.get('is_paid')
		}]);
		this.showChildView('is_paid', paidView);

		var statusView = new DropdownView({
			name: 'status'
		});
		this.listenTo(statusView, 'render', function(view) {
			var selected = view.getSelected();
			if (selected) {
				view.getUI('button').addClass(selected.get('badge'));
			}
		}.bind(this));
		this.listenTo(statusView, 'select', function() {
			this.triggerMethod('field:change');
			this.getUI('notify').show();
		}.bind(this));
		statusView.getOptions().add([{
				'value': 'pending',
				'label': 'À traiter',
				'badge': 'badge-primary',
				'selected': this.model.get('status') === 'pending'
			},
			{
				'value': 'processing',
				'label': 'En cours',
				'badge': 'badge-warning',
				'selected': this.model.get('status') === 'processing'
			},
			{
				'value': 'processed',
				'label': 'Traitée',
				'badge': 'badge-info',
				'selected': this.model.get('status') === 'processed'
			},
			{
				'value': 'shipped',
				'label': 'Expédiée',
				'badge': 'badge-success',
				'selected': this.model.get('status') === 'shipped'
			},
			{
				'value': 'cancelled',
				'label': 'Annulée',
				'badge': 'badge-danger',
				'selected': this.model.get('status') === 'cancelled'
			},
		]);
		this.showChildView('status', statusView);

	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		).done(function() {
			this.getUI('notify').hide();
		}.bind(this));
	}

});
