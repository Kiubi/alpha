var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/stats/live',

	isNew: function() {
		return false;
	},

	defaults: {
		"visitors": null
	}

});
