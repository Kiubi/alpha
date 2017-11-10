var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

	urlRoot: function() {
		return 'sites/@site/appearance/layouts/' + this.get('page');
	},

	idAttribute: 'layout_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		layout_id: null,
		is_multi_layouts: false,
		name: '',
		page: '',
		is_default: false,
		service: '',
		page_title: '',
		usage_count: 0,
		model: {}
	},

	/**
	 * Return all page types
	 *
	 * @returns {Promise}
	 */
	getTypes: function() {
		// TODO : cache
		return Backbone.ajax({
			url: 'sites/@site/appearance/types.json'
		}).then(function(response) {

			var types = {};

			_.each(response.data, function(type) {

				if (!types[type.service]) {
					types[type.service] = [];
				}

				types[type.service].push({
					name: type.name,
					page: type.page,
					is_multi_layouts: type.is_multi_layouts || false
				});

			});

			return types;
		});
	},

	/**
	 * Return a page type
	 *
	 * @param {String} type
	 * @returns {Promise}
	 */
	getType: function(type) {
		// TODO : cache
		return Backbone.ajax({
			url: 'sites/@site/appearance/types/' + type + '.json'
		}).then(function(response) {
			return {
				// service: response.data.service,
				// short: response.data.short,
				name: response.data.name,
				page: response.data.page,
				is_multi_layouts: response.data.is_multi_layouts || false
			};
		});
	}

});
