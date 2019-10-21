var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Linked = CollectionUtils.KiubiModel.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/linked';
	},

	idAttribute: 'linked_product_id',

	defaults: {
		product_id: null,
		link: '',
		linked_product_id: null,
		name: '',
		categories: []
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/linked';
	},

	model: Linked

});
