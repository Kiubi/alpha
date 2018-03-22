var Backbone = require('backbone');

var Redirection = Backbone.Model.extend({

	urlRoot: 'sites/@site/seo/redirections',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		uri: '',
		target: ''
	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/seo/redirections',

	model: Redirection,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

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
		}).then(function(response) {
			return response.data;
		});
	}

});
