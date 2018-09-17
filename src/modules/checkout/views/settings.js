var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior, SelectifyBehavior],

	fields: [
		'order_prefix',
		'stockout_selling',
		'stockout_threshold',
		'decrement_stock',
		'min_order_amount'
	],

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
