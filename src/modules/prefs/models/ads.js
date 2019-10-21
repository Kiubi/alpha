var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/ads',

	isNew: function() {
		return false;
	},

	defaults: {
		ads: '',
		app_ads: ''
	}

});
