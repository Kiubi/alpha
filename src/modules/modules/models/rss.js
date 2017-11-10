var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/rss',

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
		is_enabled: false,
		post_count: null
	}

});
