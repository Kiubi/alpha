var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

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
	},

	/**
	 *
	 * @param {Object} options Options list :
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(options, selected) {

		options = _.extend({}, options);

		var that = this;
		return this.fetch().then(function() {
			var collector = [];
			that.each(function(model) {
				collector.push({
					'value': model.get('group_id'),
					'label': model.get('name'),
					'selected': selected && model.get('group_id') == selected
				});
			});

			return new CollectionUtils.SelectCollection(collector);
		});
	}

});
