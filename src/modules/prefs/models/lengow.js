var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/lengow',

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
		"is_enabled": false,
		"categories": [],
		"id": "",
		"is_tracker_enabled": false,
		"export_url": "",
		"last_export": ""
	}

});
