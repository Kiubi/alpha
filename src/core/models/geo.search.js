var Backbone = require('backbone');
var _ = require('underscore');

var Result = Backbone.Model.extend({

	defaults: {
		cities: '',
		distance: 0.0,
		postal_code: ''
	}

});

module.exports = Backbone.Collection.extend({

	url: 'geo/search',

	model: Result,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
