var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/categories',
	idAttribute: 'category_id',

	previewLink: null,

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					category_id: response.data
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
		category_id: null,
		name: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		slug: '',
		is_visible: false,
		layout_id: null
	}

});
