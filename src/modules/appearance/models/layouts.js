var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/appearance/layouts',

	model: require('./layout'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}
});
