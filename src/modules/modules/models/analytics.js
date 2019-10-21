var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/modules/analytics',

	isNew: function() {
		return false;
	},

	defaults: {
		ua: '',
		is_enabled: false,
		type: '',
		target: '',
		options: ''
	}

});
