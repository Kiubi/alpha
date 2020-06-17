var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
//var _ = require('underscore');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/themes/current/conversion',

	isNew: function() {
		return false;
	},

	defaults: {
		warnings: [],
		errors: [],
		zones: [],
		is_compatible: false
	},

	/**
	 *
	 * @param {String} zone
	 * @returns {Promise}
	 */
	convert: function(zone) {
		return Backbone.ajax({
			url: this.url,
			method: 'POST',
			data: {
				zone: zone,
				type: 'component'
			}
		}).then(function(data, meta) {
			return data;
		});
	}

});
