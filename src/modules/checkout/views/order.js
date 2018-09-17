var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var Forms = require('kiubi/utils/forms.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');

var ActivityView = Marionette.View.extend({

	template: _.template(
		'<% _.each(activity, function(item){ %> <p><%- item.message %><br/> le <%- item.date %> <% if(item.user) { %> <br/> par <%- item.user %> <% } %></p><%}) %>'
	),

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	templateContext: function() {
		var activities = _.map(this.model.get('activity'), function(activity) {
			activity.date = format.formatLongDateTime(activity.date);
			return activity;
		});

		return {
			activity: activities
		};
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/order.html'),
	className: 'container container-large',
	service: 'checkout',

	behaviors: [FormBehavior],

	ui: {
		'selectPaid': 'select[name="is_paid"]',
		'selectStatus': 'select[name="status"]',
		'notify': 'div[data-role="notify"]'
	},

	events: {
		'change @ui.selectPaid': function() {
			this.getUI('notify').show();
		},
		'change @ui.selectStatus': function() {
			this.getUI('notify').show();
		}
	},

	regions: {
		'activity': {
			el: 'div[data-role="activity"]',
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
	},

	templateContext: function() {

		var google_maps = 'https://maps.google.fr/maps?h=q&hl=fr&q=';
		var shipping_map, billing_map;
		if (this.model.get('shipping_address')) {
			var shipping_address = this.model.get('shipping_address');
			shipping_map = google_maps +
				shipping_address.address + ' ' +
				shipping_address.zipcode + ' ' +
				shipping_address.city + ' ' +
				shipping_address.country;
		}
		if (this.model.get('billing_address')) {
			var billing_address = this.model.get('billing_address');
			billing_map = google_maps +
				billing_address.address + ' ' +
				billing_address.zipcode + ' ' +
				billing_address.city + ' ' +
				billing_address.country;
		}

		var shipping = this.model.get('shipping');
		var scheduled_date;
		if (shipping.scheduled) {
			scheduled_date = shipping.scheduled.indexOf(' ') === -1 ? format.formatDate(shipping.scheduled) : format.formatLongDateTime(
				shipping.scheduled);
		}

		return {
			shipping_map: shipping_map,
			billing_map: billing_map,
			scheduled_date: scheduled_date
		};
	},

	onRender: function() {
		this.showChildView('activity', new ActivityView({
			model: this.model
		}));
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		).done(function() {
			this.getUI('notify').hide();
			this.getChildView('activity').render();
		}.bind(this));
	}

});
