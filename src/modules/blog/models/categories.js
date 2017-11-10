var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/blog/categories',
	model: require('./category'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.category_id,
				'label': item.name
			};
		});
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkShow: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_visible')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_visible': true
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkHide: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_visible')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_visible': false
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			return model.destroy();
		}, ids);

	}

});
