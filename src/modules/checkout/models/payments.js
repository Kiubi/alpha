var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var supported = [
	'systempay',
	'paybox',
	'cheque',
	'virement',
	'paypal',
	'cm_cic',
	'atos',
	'payline',
	'payplug'
];

var Payment = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/checkout/payments',
	idAttribute: 'payment_id',

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

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/checkout/payments',

	model: Payment,

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/checkout/payments',
			method: 'PUT',
			data: {
				order: list
			}
		});
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;
		return this.fetch().then(function() {

			var collector = [];
			that.each(function(model) {
				collector.push({
					'value': model.get('payment_id'),
					'label': model.get('name'),
					'selected': selected && model.get('payment_id') == selected
				});
			});

			return new CollectionUtils.SelectCollection(collector);
		});
	}

});
