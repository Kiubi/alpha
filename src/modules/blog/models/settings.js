var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/blog',

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
		comments_allowed: false,
		comments_captcha: false,
		comments_anonymous: false,
		comments_autopublish: false
	}

});
