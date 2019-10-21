var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format');

var Voucher = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/checkout/vouchers',
	idAttribute: 'voucher_id',

	meta: {},

	defaults: {
		"voucher_id": null,
		"code": '',
		"type": '',
		"value": 0.0,
		"value_label": '',
		"start_date": '',
		"end_date": '',
		"is_enabled": false,
		"stock": 0,
		"used": 0,
		"is_stock_unlimited": false,
		"quota": 0,
		"is_quota_unlimited": false,
		"threshold": 0.0,
		"threshold_label": '',
		"has_restrictions": false,
		"creation_date": '',
		"modification_date": '',
		"carrier_id": null
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/checkout/vouchers',

	model: Voucher,

	/**
	 *
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkEnable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_enabled')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': true
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkDisable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_enabled')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': false
			}, {
				patch: true
			});
		}, ids);

	}

});
