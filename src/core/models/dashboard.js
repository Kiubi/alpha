var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/dashboard',

	isNew: function() {
		return false;
	},

	defaults: {
		"widgets": [],
		"messages": []
	},

	/**
	 * 
	 * @param {String} code
	 * @returns {boolean}
	 */
	hasWidget: function(code) {

		if (!this.get('widgets') || this.get('widgets').length == 0) return false;

		return this.get('widgets').indexOf(code) >= 0;

	}

});
