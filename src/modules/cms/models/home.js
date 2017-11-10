var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	url: 'sites/@site/cms/home',
	idAttribute: 'page_id',

	previewLink: null,

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};

			if (response.meta && response.meta.link && response.meta.link.preview) {
				this.previewLink = response.meta.link.preview;
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		page_id: null,
		name: '',
		is_visible: false,
		is_home: false,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null
	}

});
