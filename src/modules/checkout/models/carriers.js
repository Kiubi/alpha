var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Carrier = Backbone.Model.extend({
	urlRoot: 'sites/@site/checkout/carriers',
	idAttribute: 'carrier_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					carrier_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"carrier_id": null,
		"name": '',
		"is_enabled": false,
		"is_default": false,
		"description": '',
		"position": 0,
		"type": '',
		// "use_inet": false,
		// "tax_id": null,
		// "company": '',
		// "address": '',
		// "zipcode": '',
		// "city": '',
		// "country_id": null,
		// "country": '',
		// "identifier": '',
		// "secret_key": '',
		// "threshold": '',
		// "require_scheduling": '',
		// "open_days": [],
		// "closed_days": [],
		// "limit_hour": '',
		// "scheduling_interval_min": '',
		// "scheduling_interval_max": '',
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/checkout/carriers',

	model: Carrier,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Object} options Options list :
	 * 					{boolean} exclude_pickup
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(options, selected) {

		var options = _.extend({
			'exclude_pickup': false
		}, options);

		var that = this;
		return this.fetch().then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			that.each(function(model) {

				if (options.exclude_pickup && model.get('type') == 'magasin') return;

				collector.push({
					'value': model.get('carrier_id'),
					'label': model.get('name'),
					'selected': selected && model.get('carrier_id') == selected
				});
			});

			c.add(collector);

			return c;
		});
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkEnable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_enabled')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': true
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
	bulkDisable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_enabled')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': false
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
