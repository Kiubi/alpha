var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Image = CollectionUtils.KiubiModel.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/images';
	},

	idAttribute: 'media_id',

	defaults: {
		media_id: null,
		product_id: null,
		position: 0,
		name: '',
		original_name: ''
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/images';
	},

	model: Image,


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
