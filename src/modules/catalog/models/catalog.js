var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/catalog',

	isNew: function() {
		return false;
	},

	defaults: {
		products_count: 0
	}

});
