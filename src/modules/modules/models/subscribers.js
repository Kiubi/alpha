var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Subscriber = Backbone.Model.extend({

	urlRoot: 'sites/@site/subscribers',
	idAttribute: 'subscriber_id',


	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					subscriber_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"subscriber_id": null,
		"email": '',
		"is_registered": false,
		"subscription_date": ''
	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/subscribers',

	model: Subscriber,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkSubscribe: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_registered')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_registered': true
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkUnsubscribe: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_registered')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_registered': false
			}, {
				patch: true
			});
		}, ids);

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
