var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/blog',

	isNew: function() {
		return false;
	},

	defaults: {
		posts_count: 0
	}

});
