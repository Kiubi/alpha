var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/account/groups',

	model: require('./group'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.group_id,
				'label': item.name
			};
		});
	},

	/**
	 * Suggest groups
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @param {Number[]} exclude
	 * @returns {Promise}
	 */
	suggest: function(term, limit, exclude) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/account/groups',
			data: {
				term: term,
				exclude: exclude,
				limit: limit || 5
			}
		}).then(function(response) {
			return _.map(response.data, function(group) {
				return {
					group_id: group.group_id,
					name: group.name
				};
			});
		});
	}

});
