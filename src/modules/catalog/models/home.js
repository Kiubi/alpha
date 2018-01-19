var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/catalog/home',

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

	isNew: function() {
		return false;
	},

	defaults: {
		name: '',
		description: '',
		is_visible: false,
		modification_date: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null
	}

});
