var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/catalog/categories',
	model: require('./category'),

	/**
	 *
	 * @param {Number[]} ids
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
	 * @param {Number[]} ids
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
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {
		return CollectionUtils.bulkGroupAction(this, function(slice) {
			return Backbone.ajax({
				url: 'sites/@site/catalog/categories',
				method: 'DELETE',
				data: {
					categories: slice
				}
			});
		}, ids, 100).done(function(ids) {
			this.remove(ids);
		}.bind(this));
	},

	/**
	 * Suggest categories
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @param {Number[]} exclude
	 * @returns {Promise}
	 */
	suggest: function(term, limit, exclude) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/catalog/categories',
			data: {
				term: term,
				exclude: exclude,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(category) {
				return {
					category_id: category.category_id,
					name: category.name
				};
			});
		});
	}

});
