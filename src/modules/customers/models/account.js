var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/account',

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
		customers_count: 0
	}

});
