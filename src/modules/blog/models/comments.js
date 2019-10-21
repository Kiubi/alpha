var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Comment = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/blog/comments',
	idAttribute: 'comment_id',

	defaults: {
		comment_id: null,
		date: '',
		comment: '',
		origin: '',
		is_visible: false,
		author: '',
		email: '',
		website: '',
		post_id: 0,
		post_title: '',
		customer_id: null,
		avatar_url: '',
		avatar_thumb_url: '',
		ip: '',
		reverse_host: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: function() {
		return 'sites/@site/blog/comments';
	},
	model: Comment,

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
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {
		return CollectionUtils.bulkGroupAction(this, function(slice) {
			return Backbone.ajax({
				url: 'sites/@site/blog/comments',
				method: 'DELETE',
				data: {
					comments: slice
				}
			});
		}, ids, 100).done(function(ids) {
			this.remove(ids);
		}.bind(this));
	}

});
