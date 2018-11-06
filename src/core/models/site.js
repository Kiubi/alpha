var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites',
	idAttribute: 'code_site',

	parse: function(response) {
		if (response.data) {
			if (_.isNumber(response.data)) {
				return {
					site_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		code_site: '',
		domain: '',
		backoffice: '',
		name: '',
		scopes: [], // extra_fields = scopes
		features: [] // extra_fields = features
	},

	/**
	 *
	 * @param term
	 * @returns {*}
	 */
	searchSite: function(term) {

		var current = this.get('code_site');

		return Backbone.ajax({
			url: 'sites.json',
			data: {
				term: term,
				limit: 5
			}
		}).then(function(response) {
			return _.filter(response.data, function(site) {
				return site.code_site != current;
			});
		});
	}

});
