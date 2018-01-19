var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior, SelectifyBehavior],

	fields: [
		'order_prefix',
		'stockout_selling',
		'stockout_threshold',
		'decrement_stock'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
