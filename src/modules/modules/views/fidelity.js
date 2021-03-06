var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format');

module.exports = Marionette.View.extend({
	template: require('../templates/fidelity.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	fields: [
		'gain_rate',
		'reward_first_order',
		'reward_subscriber',
		'is_creation_enabled',
		'creation_cost',
		'voucher_mail_subject',
		'voucher_value',
		'voucher_validity',
		'voucher_threshold',
		'is_voucher_restricted'
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
				patch: true,
				wait: true
			}
		);
	}

});
