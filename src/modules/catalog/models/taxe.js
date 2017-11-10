var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/taxes',
	idAttribute: 'tax_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					tax_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		tax_id: null,
		vat_rate: 0.0,
		is_default: false
	}

});
