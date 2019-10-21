var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');
var _string = require('underscore.string');


var Tax = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/catalog/taxes',
	idAttribute: 'tax_id',

	defaults: {
		tax_id: null,
		vat_rate: 0.0,
		is_default: false
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/catalog/taxes',
	model: Tax,

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.tax_id,
				'label': _string.numberFormat(parseFloat(item.vat_rate), 2, ',', ' ') + ' %'
			};
		});
	}

});
