var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/iadvize',

	isNew: function() {
		return false;
	},

	defaults: {
		id: '',
		is_enabled: false
	}

});
