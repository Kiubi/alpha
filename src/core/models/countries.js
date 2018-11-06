var Backbone = require('backbone');
var _ = require('underscore');

var Country = Backbone.Model.extend({
	urlRoot: 'geo/countries',
	idAttribute: 'country_id',
	parse: function(response) {
		if (response.data) {
			if (_.isNumber(response.data)) {
				return {
					user_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		country_id: 0,
		name: '',
		code: '',
		group_id: 0,
		group_name: ''
	}
});

module.exports = Backbone.Collection.extend({

	url: 'geo/countries',

	model: Country,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.country_id,
				'label': item.name
			};
		});
	}

});
