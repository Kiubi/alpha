var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/lengow',

	isNew: function() {
		return false;
	},

	defaults: {
		"is_enabled": false,
		"categories": [],
		"id": "",
		"is_tracker_enabled": false,
		"export_url": "",
		"last_export": ""
	}

});
