var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/catalog',

	isNew: function() {
		return false;
	},

	defaults: {
		is_enabled: false,
		currency: 'EUR',
		display_taxes: false,
		is_duty_free: false,
		comments_allowed: false,
		comments_captcha: false,
		comments_anonymous: false,
		comments_autopublish: false,
		require_auth: false
	}

});
