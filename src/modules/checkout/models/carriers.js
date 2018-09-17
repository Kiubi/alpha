var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Carrier = Backbone.Model.extend({
	urlRoot: 'sites/@site/checkout/carriers',
	idAttribute: 'carrier_id',

	meta: {},

	parse: function(response) {
		this.meta = {};
		if ('meta' in response && response.meta.base_price) {
			this.meta = {
				'base_price': response.meta.base_price,
				'currency': response.meta.currency
			};
		}
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
		"is_deletable": false,
		"description": '',
		"position": 0,
		"type": '',
		"use_coliship": false,
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
		"require_scheduling": 'no',
		"open_days": [],
		"closed_days": [],
		"limit_hour": null,
		"scheduling_interval_min": null,
		"scheduling_interval_max": null,
		// Detail
		"coliship_type": null,
		"coliship_tradername": '',
		"socolissimo_id": null,
		"socolissimo_secret": null,
		"socolissimo_be_enabled": null,
		"socolissimo_be_extra": null,
		"socolissimo_pickup_franco": null
	},

	isSupported: function() {
		return (this.get('type') == 'magasin' || this.get('type') == 'socolissimo' || this.get('type') == 'local' || this.get(
			'type') == 'tranchespoids');
	},

	isDeletable: function() {
		return (this.get('is_deletable') == true);
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

		options = _.extend({
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

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/checkout/carriers',
			method: 'PUT',
			data: {
				order: list
			}
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
