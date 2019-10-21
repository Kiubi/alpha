var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/https',

	isNew: function() {
		return false;
	},

	defaults: {
		is_enabled: false,
		status: null,
		domain_IP: ''
	}

});
