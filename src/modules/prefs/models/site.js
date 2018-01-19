var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs',

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
		site_title: '',
		is_site_open: false,
		is_contact_enabled: false,
		is_api_enabled: false,
		is_blog_enabled: false,
		is_catalog_enabled: false,
		is_checkout_enabled: false,
		front_login: '',
		front_password: '',
		breadcrumb: {}
	}

});
