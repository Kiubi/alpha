var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Brand = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/brands',
	idAttribute: 'brand_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					brand_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		brand_id: null,
		name: ''
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/catalog/brands',
	model: Brand,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			return model.destroy();
		}, ids);

	},

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
		}).then(function(response) {
			return _.map(response.data, function(brand) {
				return {
					brand_id: brand.brand_id,
					name: brand.name
				};
			});
		});
	}

});
