var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/ftp',

	isNew: function() {
		return false;
	},

	defaults: {
		host: '',
		port: null,
		login: '',
		password: ''
	}

});
