var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/newsletter',

	isNew: function() {
		return false;
	},

	defaults: {
		registration_success_msg: '',
		unregistration_success_msg: '',
		registration_error_msg: '',
		unregistration_error_msg: ''
	}

});
