var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/checkout',

	isNew: function() {
		return false;
	},

	defaults: {
		pending_count: 0,
		processing_count: 0,
		processed_count: 0,
		shipped_count: 0,
		cancelled_count: 0
	}

});
