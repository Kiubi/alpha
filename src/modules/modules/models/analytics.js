var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/modules/analytics',

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
		ua: '',
		is_enabled: false,
		type: '',
		target: '',
		options: ''
	}

});
