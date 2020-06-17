var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Symbol = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/symbols',
	idAttribute: 'symbol_id',

	defaults: {
		symbol_id: null,
		model: '',
		zones: null,
		params: null
	},

	getTitle: function() {
		return this.get('params') ? this.get('params').title : '';
	},

	getBackURL: function() {
		return '/cms/symbols/' + this.get('symbol_id');
	},

	/**
	 * Return all models
	 *
	 * @returns {Promise}
	 */
	getModels: function(options) {

		options = options || {};

		return Backbone.ajax({
			url: 'sites/@site/cms/symbols/models.json',
			data: options
		}).then(function(data, meta) {
			return _.map(data, function(model) {
				return {
					id: model.id,
					name: model.name,
					fields: model.fields || [],
					zones: model.zones || []
					// structure: model.structure
				};
			});
		});
	},

	/**
	 * Duplicate current symbol
	 *
	 * @return {Promise}
	 */
	duplicate: function() {
		var that = this;
		return Backbone.ajax({
			url: 'sites/@site/cms/symbols/' + this.get('symbol_id'),
			method: 'POST'
		}).then(function(data, meta) {
			var copy = that.clone();
			copy.set(copy.parse({
				data: data,
				meta: meta
			}));
			return copy;
		});
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({


	url: function() {
		return 'sites/@site/cms/symbols';
	},

	model: Symbol

});
