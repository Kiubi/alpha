var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/theme',

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
		site_excerpt: '',
		is_excerpt_visible: false,
		site_description: '',
		is_description_visible: false,
		logo_media_id: null,
		is_logo_visible: false
	}

});
