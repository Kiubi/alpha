var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	defaults: {
		'api': 'https://api.kiubi.com',
		'ga_tracker': null
	}
});
