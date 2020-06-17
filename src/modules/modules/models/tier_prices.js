var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format');

var Grid = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/catalog/tier_prices',
	idAttribute: 'grid_id',

	defaults: {
		"grid_id": null,
		"is_enabled": false,
		"product_count": 0
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/catalog/tier_prices',

	model: Grid,

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
