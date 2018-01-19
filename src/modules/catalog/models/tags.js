var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Tag = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/tags',
	idAttribute: 'tag_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					tag_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		tag_id: null,
		name: ''
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/catalog/tags',
	model: Tag,
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

	}
});
