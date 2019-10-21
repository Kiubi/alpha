var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Comment = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/catalog/comments',
	idAttribute: 'comment_id',

	defaults: {
		comment_id: null,
		is_visible: false,
		date: '',
		comment: '',
		origin: '',
		author: '',
		ip: '',
		rate: null,
		reverse_host: '',
		product_id: null,
		product_name: '',
		customer_id: null,
		customer_name: '',
		customer_email: '',
		customer_nickname: '',
		avatar_url: '',
		avatar_thumb_url: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	product_id: null,

	url: function() {
		if (this.product_id > 0) return 'sites/@site/catalog/products/' + this.product_id + '/comments';
		return 'sites/@site/catalog/comments';
	},
	model: Comment,

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
				url: 'sites/@site/catalog/comments',
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
