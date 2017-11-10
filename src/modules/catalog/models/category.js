var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/categories',
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
		description: '',
		media_id: null,
		is_visible: false,
		is_main: false,
		slug: '',
		product_count: null,
		creation_date: '',
		creation_date_f: '',
		creation_date_timestamp: null,
		modification_date: '',
		modification_date_f: '',
		modification_date_timestamp: null,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null
	}

});
