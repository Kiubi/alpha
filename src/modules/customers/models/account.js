var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/account',

	isNew: function() {
		return false;
	},

	defaults: {
		customers_count: 0
	}

});
