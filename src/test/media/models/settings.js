var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/medias',

	parse: function(response) {
		if (response.data) {
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		// TODO
	}

});
