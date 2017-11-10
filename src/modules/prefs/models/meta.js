var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/seo/meta',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: ''
	}

});
