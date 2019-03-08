var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	defaults: {
		'api': 'https://api.kiubi.com',
		'api_version': 1,
		'account': 'https://www.kiubi-admin.com',
		'client_version': 1,
		'ga_tracker': null
	}
});
