var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Departement = CollectionUtils.KiubiModel.extend({
	urlRoot: '/geo/countries/fr/departments',
	idAttribute: 'id',

	defaults: {
		id: null,
		name: '',
		code: ''
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: '/geo/countries/fr/departments',

	model: Departement,

	/**
	 *
	 * @param {Number} selected
	 * @param {Object} options Options list :
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;
		return this.fetch().then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			that.each(function(model) {
				collector.push({
					'value': model.get('code'),
					'label': model.get('code') + ' - ' + model.get('name'),
					'selected': selected && model.get('code') == selected
				});
			});

			c.add(collector);

			return c;
		});
	}

});
