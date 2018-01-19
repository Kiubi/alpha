var Backbone = require('backbone');
var _ = require('underscore');

var Variant = Backbone.Model.extend({
	urlRoot: function() {
		return 'sites/@site/catalog/products/' + this.get('product_id') + '/variants';
	},

	idAttribute: 'variant_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					variant_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		variant_id: null,
		product_id: 0,
		name: '',
		reference: '',
		gtin: '',
		condition: '',
		weight: 0,
		tax_id: 0,
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
		}).then(function(response) {
			var copy = that.clone();
			copy.set(response.data);
			return copy;
		});
	}

});



module.exports = Backbone.Collection.extend({

	product_id: null,

	url: function() {
		return 'sites/@site/catalog/products/' + this.product_id + '/variants';
	},

	model: Variant,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

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
