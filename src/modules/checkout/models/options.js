var Backbone = require('backbone');
var _ = require('underscore');

var Option = Backbone.Model.extend({
	urlRoot: 'sites/@site/checkout/options',
	idAttribute: 'option_id',

	meta: {},

	parse: function(response) {
		this.meta = {};
		if ('meta' in response && response.meta.base_price) {
			this.meta = {
				'base_price': response.meta.base_price,
				'currency': response.meta.currency
			};
		}
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					option_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"option_id": null,
		"name": "",
		"description": "",
		"is_enabled": false,
		"tax_id": null,
		"price_ex_vat": 0,
		"price_inc_vat": 0,
		"price_ex_vat_label": "",
		"price_inc_vat_label": "",
		"type": "simple",
		"values": [],
		"position": 0,
		"creation_date": null,
		"modification_date": null
	},

	/**
	 * Test if current type is supported
	 *
	 * @returns {boolean}
	 */
	isSupported: function() {
		return (this.get('type') == 'simple' || this.get('type') == 'textarea' || this.get('type') == 'select');
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/checkout/options',

	model: Option,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/checkout/options',
			method: 'PUT',
			data: {
				order: list
			}
		});
	}

});
