var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('../../../behaviors/simple_form');
var Forms = require('../../../utils/forms');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior],

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
