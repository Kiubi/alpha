var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Country = CollectionUtils.KiubiModel.extend({
	urlRoot: 'geo/countries',
	idAttribute: 'country_id',

	defaults: {
		country_id: 0,
		name: '',
		code: '',
		group_id: 0,
		group_name: ''
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'geo/countries',

	model: Country,

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.country_id,
				'label': item.name
			};
		});
	}

});
