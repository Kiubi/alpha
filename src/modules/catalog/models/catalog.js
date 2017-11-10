var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/catalog',

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
		products_count: 0
	}

});
