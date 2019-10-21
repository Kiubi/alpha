var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/merchantcenter',

	isNew: function() {
		return false;
	},

	defaults: {
		is_enabled: false,
		last_export: null,
		export_url: '',
		categories: [
			// name : '',
			// category_id : null,
			// mc_name : '',
			// mc_category_id : null
		]
	},

	/**
	 * Search in Merchant Center categories
	 *
	 * @param {String} term
	 * @returns {Promise}
	 */
	searchCategories: function(term) {

		return Backbone.ajax({
			url: this.url + '/categories',
			method: 'GET',
			data: {
				term: term,
				limit: 5
			}
		}).then(function(data, meta) {
			return data;
		});
	}

});
