var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites',
	idAttribute: 'code_site',

	defaults: {
		code_site: '',
		domain: '',
		backoffice: '',
		name: ''
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
				term: term
			}
		}).then(function(response) {
			return _.filter(response.data, function(site) {
				return site.code_site != current;
			});
		});
	}

});
