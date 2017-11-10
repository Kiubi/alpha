var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/customers',

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
		allow_registration: 0,
		allow_login: 0,
		validation: 'captcha',
		default_group_id: '',
		terms: ''
	}

});
