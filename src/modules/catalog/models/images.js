var Backbone = require('backbone');
var _ = require('underscore');

var Image = Backbone.Model.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/images';
	},

	idAttribute: 'media_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					media_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		media_id: null,
		product_id: null,
		position: 0,
		name: '',
		original_name: ''
	}

});


module.exports = Backbone.Collection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/images';
	},

	model: Image,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 * Reorder current product images
	 *
	 * @param {Array} list
	 */
	reOrder: function(list) {

		// Set position attribute in current collection
		var p = 1;
		_.each(list, function(id) {
			var m = this.get(id);
			if (m) {
				m.set('position', p++);
			}
		}.bind(this));

		return Backbone.ajax({
			url: 'sites/@site/catalog/products/' + this.product_id + '/images',
			method: 'PUT',
			data: {
				order: list
			}
		});
	}

});
