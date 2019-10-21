var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Step = Backbone.Model.extend({

	defaults: {
		//'step_id': null,
		"weight": 0,
		"price_ex_vat": 0,
		"price_inc_vat": 0,
		"price_ex_vat_label": '',
		"price_inc_vat_label": ''
	}

});

var Steps = Backbone.Collection.extend({

	model: Step

});

var Zone = CollectionUtils.KiubiModel.extend({

	urlRoot: function() {
		return 'sites/@site/checkout/carriers/' + this.get('carrier_id') + '/zones';
	},
	idAttribute: 'zone_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					zone_id: response.data
				};
			}

			if (response.data.steps) response.data.steps = new Steps(response.data.steps);

			return response.data;
		}
		return response;
	},

	defaults: {
		'carrier_id': null,
		'zone_id': null,
		'postal_codes': [],
		'free_threshold': null,
		'steps': null // cf {Backbone.Collection} Steps
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	carrier_id: null,

	url: function() {
		return 'sites/@site/checkout/carriers/' + this.carrier_id + '/zones';
	},

	model: Zone,

	parse: function(response) {
		this.meta = response.meta;

		_.map(response.data, function(data) {
			data.carrier_id = this.carrier_id; // Endpoint does not repeat carrier_id
		}.bind(this));

		return response.data;
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;
		return this.fetch().then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			that.each(function(model) {
				collector.push({
					'value': model.get('zone_id'),
					'label': _.isArray(model.get('postal_codes')) ? model.get('postal_codes').join(',') : model.get(
						'postal_codes'),
					'selected': selected && model.get('zone_id') == selected
				});
			});

			c.add(collector);

			return c;
		});
	}

});
