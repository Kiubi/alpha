var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Option = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/checkout/options',
	idAttribute: 'option_id',

	meta: {},

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

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/checkout/options',

	model: Option,

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
