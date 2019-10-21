var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs',

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
