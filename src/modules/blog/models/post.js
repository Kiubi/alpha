var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
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
