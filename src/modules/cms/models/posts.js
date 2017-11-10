var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = Backbone.Collection.extend({

	page_id: null,

	url: function() {
		if (this.page_id > 0) return 'sites/@site/cms/pages/' + this.page_id +
			'/posts';
		return 'sites/@site/cms/posts';
	},

	model: require('./post'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	reOrder: function(page_id, list) {
		return Backbone.ajax({
			url: 'sites/@site/cms/pages/' + page_id + '/posts',
			method: 'PUT',
			data: {
				order: list
			}
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
