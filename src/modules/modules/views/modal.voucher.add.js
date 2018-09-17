var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/modal.voucher.add.html'),

	ui: {
		'select-amount': 'div[data-role="select-amount"]',
		'select-percent': 'div[data-role="select-percent"]',
		'select-shipping': 'div[data-role="select-shipping"]'
	},

	events: {
		'click @ui.select-amount': function() {
			this.trigger('select:amount', 'amount');
		},
		'click @ui.select-percent': function() {
			this.trigger('select:percent', 'percent');
		},
		'click @ui.select-shipping': function() {
			this.trigger('select:shipping', 'shipping');
		}
	}

});
