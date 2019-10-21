var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/blog',

	isNew: function() {
		return false;
	},

	defaults: {
		is_enabled: false,
		comments_allowed: false,
		comments_captcha: false,
		comments_anonymous: false,
		comments_autopublish: false,
		is_rss_enabled: false,
		rss_post_count: 0
	}

});
