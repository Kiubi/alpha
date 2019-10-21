var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');

var Redirection = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/seo/redirections',

	defaults: {
		uri: '',
		target: ''
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/seo/redirections',

	model: Redirection,

	/**
	 * @param {Array} redirections
	 * @returns {Promise}
	 */
	bulkUpdate: function(redirections) {
		return Backbone.ajax({
			url: this.url + '/bulk',
			method: 'PUT',
			data: {
				redirections: redirections
			}
		}).then(function(data, meta) {
			return data;
		});
	}

});
