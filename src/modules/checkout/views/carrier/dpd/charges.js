var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

var StepsView = require('../steps.js');

module.exports = Marionette.View.extend({
	template: require('../../../templates/carrier/dpd/charges.html'),

	regions: {
		pickup: {
			el: "div[data-role='pickup']",
			replaceElement: true
		}
	},

	ui: {
		'delay': 'input[name="delay"]',
		'free_threshold': 'input[name="free_threshold"]',

		'addPickupBtn': 'a[data-role="pickup-add"]',
		'form_pickup': 'form[data-role="pickup"]',
	},

	events: {
		'click @ui.addPickupBtn': function() {
			var view = this.getChildView('pickup');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		}
	},

	fields: [
		'delay',
		'free_threshold',
	],

	rate: null,
	pickup: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierCountries']);
		this.rate = 1;
		this.pickup = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency),
		};
	},

	updateView: function() {
		if (!this.pickup) return;

		this.getUI('free_threshold').val(format.formatFloat(this.pickup.get('free_threshold'), 2));
		this.getUI('delay').val(this.pickup.get('delay'));
	},

	onRender: function() {
		this.pickup = this.carrierCountries.add({
			carrier_id: this.model.get('carrier_id'),
			country_id: 0 // Pickup
		});
		this.pickup.fetch().done(function() {
			this.updateView();
			this.showChildView('pickup', new StepsView({
				collection: this.pickup.get('steps'),
				childViewOptions: {
					taxesProxy: this,
					currency: format.currencyEntity(this.model.meta.currency)
				}
			}));
		}.bind(this));

	},

	/* Handle Tax change */

	onTaxChange: function(rate) {
		this.rate = rate;
	},

	taxRate: function() {
		return this.rate;
	},

	onSave: function(data_country) {

		var i, w, steps;

		var data_pickup = Forms.extractFields(this.fields, this);
		steps = Forms.extractFields(['weight', 'price_ex_vat'], this, {
			selector: this.getUI('form_pickup')
		});
		if (steps.weight) {
			data_pickup.steps = {};
			for (i = 0; i < steps.weight.length; i++) {
				w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data_pickup.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data_pickup.steps = ''; // hack
		}

		return this.pickup.save(data_pickup, {
			patch: true,
			wait: true
		});

	}

});
