var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Comment = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/comments',
	idAttribute: 'comment_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					comment_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		comment_id: null,
		date: '',
		comment: '',
		origin: '',
		is_visible: false,
		author: '',
		email: '',
		post_id: 0,
		post_title: '',
		customer_id: null,
		avatar_url: '',
		avatar_thumb_url: '',
		ip: '',
		reverse_host: ''
	}

});

module.exports = Backbone.Collection.extend({

	url: function() {
		return 'sites/@site/blog/comments';
	},
	model: Comment,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
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
