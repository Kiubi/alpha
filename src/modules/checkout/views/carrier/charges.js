var Marionette = require('backbone.marionette');

var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

var StepsView = require('./steps.js');
var SelectView = require('kiubi/core/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/carrier/charges.html'),

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		},
		steps: {
			el: "div[data-role='steps']",
			replaceElement: true
		}
	},

	ui: {
		'delay': 'input[name="delay"]',
		'free_threshold': 'input[name="free_threshold"]',

		'addStepBtn': 'a[data-role="step-add"]'
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
		}
	},


	fields: [
		'delay',
		'free_threshold',
		'country_id'
	],

	rate: null,
	country: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierCountries']);
		this.rate = 1;
		this.country = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	updateView: function() {
		if (!this.country) return;
		this.getUI('free_threshold').val(format.formatFloat(this.country.get('free_threshold'), 2));
		this.getUI('delay').val(this.country.get('delay'));
	},

	onRender: function() {
		this.showChildView('countries', new SelectView({
			collectionPromise: this.carrierCountries.promisedSelect().done(function(result) {
				if (result.length > 0) {
					if (!result.at(0).get('is_group')) {
						this.selectContry(result.at(0).get('value'));
					} else if (result.length > 1) {
						this.selectContry(result.at(1).get('value'));
					}
				}
			}.bind(this)),
			name: 'country_id'
		}));

	},

	/* Handle Country change */

	onChildviewChange: function(country_id) {
		this.selectContry(parseInt(country_id));
	},

	selectContry: function(country_id) {

		this.country = this.carrierCountries.get(country_id);
		if (!this.country) return;

		this.country.fetch().done(function() {
			this.updateView();

			var view = this.getChildView('steps');
			if (!view) {
				view = new StepsView({
					collection: this.country.get('steps'),
					childViewOptions: {
						taxesProxy: this,
						currency: format.currencyEntity(this.model.meta.currency)
					}
				});
				this.showChildView('steps', view);
			} else {
				view.collection.set(this.country.get('steps').toJSON(), {
					reset: true
				});
			}

		}.bind(this));
	},

	/* Handle Tax change */

	onTaxChange: function(rate) {
		this.rate = rate;
	},

	taxRate: function() {
		return this.rate;
	},

	onSave: function() {
		var data = Forms.extractFields(this.fields, this);
		var steps = Forms.extractFields(['weight', 'price_ex_vat'], this);
		if (steps.weight) {
			data.steps = {};
			for (var i = 0; i < steps.weight.length; i++) {
				var w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data.steps = ''; // hack
		}

		return this.country.save(data, {
			patch: true,
			wait: true
		}).done(function() {
			var view = this.getChildView('countries');
			var option = view.collection.get(this.country.get('country_id'));
			var index_undefined = view.collection.findLastIndex({
				is_group: true
			});

			// At least the 2 groups => steps defined and steps undefined
			// Move an undefined country to the defined group
			if (index_undefined > 0 && view.collection.indexOf(option) > index_undefined) {
				view.collection.remove(option, {
					silent: true
				});
				view.collection.add(option, {
					at: 1
				});
				view.render();
			}

		}.bind(this));
	}

});
