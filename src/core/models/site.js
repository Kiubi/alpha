var Backbone = require('backbone');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

module.exports = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites',
	idAttribute: 'code_site',

	defaults: {
		code_site: '',
		domain: '',
		backoffice: '',
		name: '',
		plan: {
			/*
			plan_id: 0,
			plan_name: '',
			is_free
			is_closed
			is_trial
			endtrial_date,
			closing_date
			balance
			*/
		},
		scopes: [], // extra_fields = scopes
		features: [] // extra_fields = features
	},

	hasScope: function(name) {
		if (!this.get('scopes')) return false;
		return _.contains(this.get('scopes'), name);
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
		}).then(function(data) {
			return _.filter(data, function(site) {
				return site.code_site != current;
			});
		});
	}

});
