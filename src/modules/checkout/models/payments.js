var Backbone = require('backbone');
var _ = require('underscore');

var supported = [
	'systempay',
	'paybox',
	'cheque',
	'virement',
	'paypal',
	'cm_cic',
	'atos'
];

var Payment = Backbone.Model.extend({
	urlRoot: 'sites/@site/checkout/payments',
	idAttribute: 'payment_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		"payment_id": null,
		"name": "",
		"type": "",
		"is_enabled": false,
		"notification_url": null,
		"config": {}
	},

	isSupported: function() {
		return (supported.indexOf(this.get('type')) >= 0);
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/checkout/payments',

	model: Payment,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/checkout/payments',
			method: 'PUT',
			data: {
				order: list
			}
		});
	}

});
