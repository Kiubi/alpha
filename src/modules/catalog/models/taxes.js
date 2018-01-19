var Backbone = require('backbone');
var _ = require('underscore');
var _string = require('underscore.string');


var Tax = Backbone.Model.extend({
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

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/catalog/taxes',
	model: Tax,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.tax_id,
				'label': _string.numberFormat(parseFloat(item.vat_rate), 2, ',', ' ') + ' %'
			};
		});
	}

});
