var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'cobranding',

	isNew: function() {
		return false;
	},

	defaults: {
		login: {
			/*
			 logo: '',
			 background: '',
			 */
		}
	}

});
