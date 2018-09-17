var Backbone = require('backbone');
var _ = require('underscore');

var Order = Backbone.Model.extend({

	urlRoot: 'sites/@site/checkout/orders',
	idAttribute: 'order_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					order_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"order_id": null,
		"reference": "",
		"customer_id": null,
		"customer_email": "",
		"customer_number": "",
		"ip_address": "",
		"reverse_host": "",
		"creation_date": "",
		"modification_date": "",
		"status": "",
		"is_paid": false,
		"payment_id": null,
		"payment_name": "",
		"is_reintegrated": false,
		"payment_date": "",
		"price_total_inc_vat": 0.0,
		"price_total_ex_vat": 0.0,
		"price_total_inc_vat_label": "", // NEED extra_fields = price_label
		"price_total_ex_vat_label": "", // NEED extra_fields = price_label
		"base_price": "",
		"currency": "",
		"is_tax_free": false,
		"comment": "",
		"use_billing_as_shipping": true,
		"shipping": null,
		/*{"carrier_id": "integer",
		"name": "string",
		"price_ex_vat": "float",
		"price_inc_vat": "float",
		"price_ex_vat_label": "string",
		"price_inc_vat_label": "string",
		"vat_rate": "float",
		"weight": "integer",
		"is_free": "boolean",
		"destination": "string",
		"picking_number": "string",
		"scheduled": "string"
		"type"}*/
		"billing_address": {},
		/*{
					"civility": "string",
					"lastname": "string",
					"firstname": "string",
					"company": "string",
					"address": "string",
					"zipcode": "string",
					"city": "string",
					"country": "string",
					"phone": "string"
				},*/
		"shipping_address": {},
		/*{
			"civility": "string",
			"lastname": "string",
			"firstname": "string",
			"company": "string",
			"address": "string",
			"zipcode": "string",
			"city": "string",
			"country": "string",
			"phone": "string"
		},*/
		"fidelity_reward": 0

	},

	restore: function() {
		return Backbone.ajax({
			url: 'sites/@site/checkout/orders/aborted/' + this.get('order_id'),
			method: 'PUT'
		});
	}


});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/checkout/orders/aborted',

	model: Order,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
