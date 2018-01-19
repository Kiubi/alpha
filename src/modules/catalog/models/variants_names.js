var Backbone = require('backbone');
var _ = require('underscore');

var Name = Backbone.Model.extend({

	idAttribute: 'name',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};

			return response.data;
		}
		return response;
	},

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
		}.bind(this));
	}

});

module.exports = Backbone.Collection.extend({

	url: function() {
		return 'sites/@site/catalog/variants';
	},

	model: Name,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
