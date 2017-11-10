var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/checkout',

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
		pending_count: 0,
		processing_count: 0,
		processed_count: 0,
		shipped_count: 0,
		cancelled_count: 0
	}

});
