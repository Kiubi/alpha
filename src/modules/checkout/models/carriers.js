var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Carrier = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/checkout/carriers',
	idAttribute: 'carrier_id',

	meta: {},

	defaults: {
		"carrier_id": null,
		"name": '',
		"is_enabled": false,
		"is_default": false,
		"is_deletable": false,
		"description": '',
		"position": 0,
		"type": '',
		// "use_coliship": false,
		"export_type": false,
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
		"socolissimo_pickup_franco": null,
		// dpd
		'dpd_customer_center': null,
		'dpd_customer': null,
		'dpd_gmaps': null,
		'dpd_insurance_threshold': null,
		'dpd_gsm_notification': null
	},

	isSupported: function() {
		return (this.get('type') == 'magasin' || this.get('type') == 'socolissimo' || this.get('type') == 'local' || this.get(
			'type') == 'tranchespoids' || this.get('type') == 'dpd');
	},

	isDeletable: function() {
		return (this.get('is_deletable') === true);
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/checkout/carriers',

	model: Carrier,

	/**
	 *
	 * @param {Number} selected
	 * @param {Object} options Options list :
	 * 					{boolean} exclude_pickup
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected, options) {

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
	 * @param {Number[]} ids
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
	 * @param {Number[]} ids
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

	}

});
