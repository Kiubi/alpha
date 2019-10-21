var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Tag = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/catalog/tags',
	idAttribute: 'tag_id',

	defaults: {
		tag_id: null,
		name: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/catalog/tags',
	model: Tag,

	/**
	 * Suggest tags
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @param {Number[]} exclude
	 * @returns {Promise}
	 */
	suggest: function(term, limit, exclude) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/catalog/tags',
			data: {
				term: term,
				exclude: exclude,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(tag) {
				return {
					tag_id: tag.tag_id,
					name: tag.name
				};
			});
		});
	}

});
