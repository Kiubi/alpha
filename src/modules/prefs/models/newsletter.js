var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/newsletter',

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
		registration_success_msg: '',
		unregistration_success_msg: '',
		registration_error_msg: '',
		unregistration_error_msg: ''
	}

});
