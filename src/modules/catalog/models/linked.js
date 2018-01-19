var Backbone = require('backbone');
var _ = require('underscore');

var Linked = Backbone.Model.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/linked';
	},

	idAttribute: 'linked_product_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};

			return response.data;
		}
		return response;
	},

	defaults: {
		product_id: null,
		link: '',
		linked_product_id: null,
		name: '',
		categories: []
	}

});


module.exports = Backbone.Collection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/linked';
	},

	model: Linked,

	parse: function(response) {
		this.meta = response.meta;

		_.each(response.data, function(linked) {
			linked.product_id = this.product_id;
		}.bind(this));

		return response.data;
	}

});
