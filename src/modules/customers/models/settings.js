var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/customers',

	isNew: function() {
		return false;
	},

	defaults: {
		allow_registration: false,
		allow_login: false,
		validation: 'captcha',
		default_group_id: null,
		terms: '',
		processing_purposes: ''
	}

});
