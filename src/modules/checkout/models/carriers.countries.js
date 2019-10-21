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

var Country = CollectionUtils.KiubiModel.extend({

	urlRoot: function() {
		return 'sites/@site/checkout/carriers/' + this.get('carrier_id') + '/countries';
	},
	idAttribute: 'country_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					country_id: response.data
				};
			}

			if (response.data.steps) response.data.steps = new Steps(response.data.steps);

			return response.data;
		}
		return response;
	},

	defaults: {
		'carrier_id': null,
		'country_id': null,
		'franco': null,
		'delay': '',
		'steps': null // cf {Backbone.Collection} Steps
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	carrier_id: null,

	url: function() {
		return 'sites/@site/checkout/carriers/' + this.carrier_id + '/countries';
	},

	model: Country,

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
		return this.fetch({
			data: {
				extra_fields: 'all_countries'
			}
		}).then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector_with = [{
				'label': 'Pays livrables',
				'is_group': true
			}];
			var collector_without = [{
				'label': 'Frais de port non défini',
				'is_group': true
			}];

			that.each(function(model) {

				var o = {
					'value': model.get('country_id'),
					'label': model.get('name'),
					'selected': selected && model.get('country_id') == selected
				};

				if (model.get('count') > 0) {
					collector_with.push(o);
				} else {
					collector_without.push(o);
				}
			});

			if (collector_with.length > 1) c.add(collector_with);
			if (collector_without.length > 1) c.add(collector_without);

			return c;
		});
	}

});
