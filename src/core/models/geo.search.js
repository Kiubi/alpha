var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Result = CollectionUtils.KiubiModel.extend({

	defaults: {
		cities: '',
		distance: 0.0,
		postal_code: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'geo/search',

	model: Result

});
