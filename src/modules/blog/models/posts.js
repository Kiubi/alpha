var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Post = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/posts',
	idAttribute: 'post_id',

	previewLink: null,

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					post_id: response.data
				};
			}

			if (response.meta && response.meta.link && response.meta.link.preview) {
				this.previewLink = response.meta.link.preview;
			}

			return response.data;
		}
		return response;
	},

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
		layout_id: null
	},

	/**
	 * Return all post types
	 *
	 * @returns {Promise}
	 */
	getTypes: function() {
		return Backbone.ajax({
			url: 'sites/@site/blog/posts_types',
			data: {
				extra_fields: 'structure'
			}
		}).then(function(response) {
			return _.map(response.data, function(type) {
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

module.exports = Backbone.Collection.extend({

	category_id: null,

	url: function() {
		if (this.category_id > 0) return 'sites/@site/blog/categories/' + this.category_id +
			'/posts';
		return 'sites/@site/blog/posts';
	},

	model: Post,
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
		}, ids, 'delete');

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
		}).then(function(response) {
			return _.map(response.data, function(post) {
				return {
					post_id: post.post_id,
					title: post.title
				};
			});
		});
	}

});
