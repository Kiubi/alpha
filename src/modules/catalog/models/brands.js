var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Brand = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/catalog/brands',
	idAttribute: 'brand_id',

	defaults: {
		brand_id: null,
		name: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/catalog/brands',
	model: Brand,

	/**
	 * Suggest brand
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/catalog/brands',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(brand) {
				return {
					brand_id: brand.brand_id,
					name: brand.name
				};
			});
		});
	}

});
