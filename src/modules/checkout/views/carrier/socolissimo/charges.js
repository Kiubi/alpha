var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

var StepsView = require('../steps.js');

module.exports = Marionette.View.extend({
	template: require('../../../templates/carrier/socolissimo/charges.html'),

	regions: {
		steps: {
			el: "div[data-role='steps']",
			replaceElement: true
		},
		pickup: {
			el: "div[data-role='pickup']",
			replaceElement: true
		}
	},

	ui: {
		'pickup_free_threshold': 'input[name="socolissimo_pickup_free_threshold"]',
		'be_extra': 'input[name="socolissimo_be_extra"]',
		'be_enabled': 'input[name="socolissimo_be_enabled"]',

		'addStepBtn': 'a[data-role="step-add"]',
		'addPickupBtn': 'a[data-role="pickup-add"]',

		'form_pickup': 'form[data-role="pickup"]',
		'form_steps': 'form[data-role="steps"]'
	},

	events: {
		'click @ui.addStepBtn': function() {
			var view = this.getChildView('steps');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		},
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
		'socolissimo_pickup_free_threshold',
		'socolissimo_be_extra',
		'socolissimo_be_enabled'
	],

	rate: null,
	country: null,
	pickup: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierCountries']);
		this.rate = 1;
		this.country = null;
		this.pickup = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency),
			socolissimo_pickup_free_threshold: this.model.get('socolissimo_pickup_free_threshold') != '' ?
				format.formatFloat(this.model.get('socolissimo_pickup_free_threshold'), 4) : '',
			socolissimo_be_extra: this.model.get('socolissimo_be_extra') != '' ?
				format.formatFloat(this.model.get('socolissimo_be_extra'), 4) : ''
		};
	},

	onRender: function() {
		this.country = this.carrierCountries.add({
			carrier_id: this.model.get('carrier_id'),
			country_id: 73 // France
		});
		this.country.fetch().done(function() {
			this.showChildView('steps', new StepsView({
				collection: this.country.get('steps'),
				childViewOptions: {
					taxesProxy: this,
					currency: format.currencyEntity(this.model.meta.currency)
				}
			}));
			this.model.set({
				delay: this.country.get('delay'),
				free_threshold: this.country.get('free_threshold')
			});
		}.bind(this));

		this.pickup = this.carrierCountries.add({
			carrier_id: this.model.get('carrier_id'),
			country_id: 0 // Pickup
		});
		this.pickup.fetch().done(function() {
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

	extractFields: function() {
		return {
			socolissimo_pickup_free_threshold: this.getUI('pickup_free_threshold').val(),
			socolissimo_be_extra: this.getUI('be_extra').val(),
			socolissimo_be_enabled: this.getUI('be_enabled').filter(":checked").val()
		};
	},

	onSave: function(data_country) {

		var i, w, steps;

		steps = Forms.extractFields(['weight', 'price_ex_vat'], this, {
			selector: this.getUI('form_steps')
		});
		if (steps.weight) {
			data_country.steps = {};
			for (i = 0; i < steps.weight.length; i++) {
				w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data_country.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data_country.steps = ''; // hack
		}

		var data_pickup = {};
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

		return Backbone.$.when(
			this.country.save(data_country, {
				patch: true,
				wait: true
			}),
			this.pickup.save(data_pickup, {
				patch: true,
				wait: true
			})
		);

	}

});
