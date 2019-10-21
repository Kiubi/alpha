var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Post = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/blog/posts',
	idAttribute: 'post_id',

	defaults: {
		post_id: null,
		title: '',
		header: '',
		content: '',
		is_visible: false,
		comments_count: 0,
		has_comments_open: false,
		slug: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		url: '',
		publication_date: '',
		category_id: null,
		category_name: '',
		thumb: null,
		layout_id: null,
		service_path: ''
	},

	/**
	 * Return all post types
	 *
	 * @param {Object} options :
	 * 						- {Boolean} structure : fetch structure
	 * 
	 * @returns {Promise}
	 */
	getTypes: function(options) {

		options = options || {};

		var data = {};
		if (options.structure) {
			data.extra_fields = 'structure';
		}

		return Backbone.ajax({
			url: 'sites/@site/blog/posts_types',
			data: data
		}).then(function(data) {
			return _.map(data, function(type) {
				return {
					type: type.type,
					name: type.name,
					position: type.position,
					fields: type.fields || []
				};
			});
		});
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: function() {
		return 'sites/@site/blog/posts';
	},

	model: Post,

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
	 * Suggest posts
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/blog/posts',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(post) {
				return {
					post_id: post.post_id,
					title: post.title
				};
			});
		});
	}

});
