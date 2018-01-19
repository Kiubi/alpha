var Backbone = require('backbone');
var _ = require('underscore');

var Domain = Backbone.Model.extend({
	urlRoot: 'sites/@site/domains',
	idAttribute: 'domain_id',

	parse: function(response) {
		if (response.data) {
			if (_.isNumber(response.data)) {
				return {
					domain_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		domain_id: null,
		is_main: false,
		is_provided: false,
		is_https_certified: false,
		name: '',
		https_status: null
	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/domains',

	model: Domain,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
