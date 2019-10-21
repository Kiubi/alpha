var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Name = CollectionUtils.KiubiModel.extend({

	idAttribute: 'name',

	defaults: {
		name: null
	},

	/**
	 *
	 * @param {String} name
	 * @returns {Promise}
	 */
	rename: function(name) {
		return Backbone.ajax({
			url: 'sites/@site/catalog/variants',
			method: 'PUT',
			data: {
				from: this.get('name'),
				to: name
			}
		}).done(function() {
			this.set('name', name);
			this.trigger('sync'); // trigger manualy sync event
		}.bind(this));
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: function() {
		return 'sites/@site/catalog/variants';
	},

	model: Name,

	/**
	 * Suggest variant name
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/catalog/variants',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(variant) {
				return {
					name: variant.name
				};
			});
		});
	}

});
