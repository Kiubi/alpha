var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Variant = CollectionUtils.KiubiModel.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/variants';
	},

	idAttribute: 'variant_id',

	defaults: {
		variant_id: null,
		product_id: 0,
		name: '',
		reference: '',
		gtin: '',
		condition: '',
		weight: 0,
		tax_id: null,
		price_ex_vat: 0.0,
		price_inc_vat: 0.0,
		price_discount_ex_vat: 0.0,
		price_discount_inc_vat: 0.0,
		price_ex_vat_label: '',
		price_inc_vat_label: '',
		price_discount_ex_vat_label: '',
		price_discount_inc_vat_label: '',
		price_ecotax: 0.0,
		price_ecotax_label: '',
		is_stock_unlimited: false,
		stock: 0,
		// position: 0,
		media_id: null,
		file_id: null
		//creation_date: '',
		//modification_date: '',
	},

	/**
	 * Duplicate current variant
	 *
	 * @return {Promise}
	 */
	duplicate: function() {
		var that = this;
		return Backbone.ajax({
			url: 'sites/@site/catalog/products/' + this.get('product_id') + '/variants',
			method: 'POST',
			data: {
				variant_id: this.get('variant_id')
			}
		}).then(function(data) {
			var copy = that.clone();
			copy.set(data);
			return copy;
		});
	}

});



module.exports = CollectionUtils.KiubiCollection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/variants';
	},

	model: Variant,

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/catalog/products/' + this.product_id + '/variants',
			method: 'PUT',
			data: {
				order: list
			}
		});
	}

});
