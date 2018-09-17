var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

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
		//"creation_date_f": "string",
		//"creation_date_timestamp": "integer",
		"modification_date": "",
		//"modification_date_f": "string",
		//"modification_date_timestamp": "integer",
		"status": "",
		"is_paid": false,
		"payment_id": null,
		"payment_name": "",
		"is_reintegrated": false,
		"payment_date": "",
		//"payment_date_f": "string",
		//"payment_date_timestamp": "integer",
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
		"voucher": null,
		/*{
			"code": "string",
			"type": "string",
			"amount": "float"
		},*/
		"items": [
			/*{
				"type": "string",
				"product_id": "integer",
				"variant_id": "integer",
				"reference": "string",
				"product_name": "string",
				"variant_name": "string",
				"quantity": "integer",
				"price_ex_vat": "float",
				"price_inc_vat": "float",
				"price_ex_vat_label": "string", // NEED extra_fields = price_label
				"price_inc_vat_label": "string", // NEED extra_fields = price_label
				"is_discounted": "boolean",
				"discount": "float",
				"vat_rate": "float",
				"price_ecotax": "float",
				"price_ecotax_label": "string",
				"is_virtual": "boolean",
				"file_id": "integer"
			}*/
		],
		"options": [
			/*{
				"option_id": "integer",
				"name": "string",
				"quantity": "integer",
				"value": "string",
				"vat_rate": "float",
				"price_ex_vat": "float",
				"price_inc_vat": "float",
				"price_ex_vat_label": "string",
				"price_inc_vat_label": "string"
			}*/
		],
		"activity": [ // // NEED extra_fields = activity
			/*{
				"message": "string",
				"date": "string",
				"user": "string"
			}*/
		],
		"fidelity_reward": 0

	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/checkout/orders',

	model: Order,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Number[]} ids
	 * @param {Boolean} is_paid
	 * @returns {Promise}
	 */
	bulkPaymentStatus: function(ids, is_paid) {
		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_paid') == is_paid) {
				// already good
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_paid': is_paid
			}, {
				patch: true
			});
		}, ids);
	},

	/**
	 *
	 * @param {Number[]} ids
	 * @param {String} status
	 * @returns {Promise}
	 */
	bulkStatus: function(ids, status) {
		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('status') == status) {
				// already good
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'status': status
			}, {
				patch: true
			});
		}, ids);
	},

	/**
	 * Suggest orders
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/checkout/orders',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(response) {
			return _.map(response.data, function(order) {
				return {
					order_id: order.order_id,
					reference: order.reference
				};
			});
		});
	}

});
