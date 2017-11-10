var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/catalog/taxes',
	model: require('./taxe'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
