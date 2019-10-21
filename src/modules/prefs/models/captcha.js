var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/captcha',

	isNew: function() {
		return false;
	},

	defaults: {
		"type": "",
		"recaptcha_key": "",
		"recaptcha_secret": ""
	}

});
