var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/products',
	idAttribute: 'product_id',

	previewLink: null,
	meta: {},

	parse: function(response) {
		this.meta = {};
		if ('meta' in response && response.meta.base_price) {
			this.meta = {
				'base_price': response.meta.base_price,
				'currency': response.meta.currency
			};
		}
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					product_id: response.data
				};
			}

			if (response.meta && response.meta.link && response.meta.link.preview) {
				this.previewLink = response.meta.link.preview;
			}

			if (response.data.variants) {
				_.each(response.data.variants, function(variant) {
					variant.product_id = response.data.product_id;
				});
			}

			return response.data;
		}
		return response;
	},

	defaults: {

		product_id: null,
		is_spotlight: false,
		available_date: null,
		is_visible: false,
		stock: 0,
		view_count: null,
		is_virtual: false,
		brand_id: null,
		brand_name: '',
		price_ex_vat_min: 0.0,
		price_ex_vat_max: 0.0,
		price_inc_vat_min: 0.0,
		price_inc_vat_max: 0.0,
		price_ex_vat_min_label: '',
		price_ex_vat_max_label: '',
		price_inc_vat_min_label: '',
		price_inc_vat_max_label: '',
		extra_shipping: 0.0,
		comments_count: 0,
		rate: 0.0,
		bought_count: null,
		variants_count: null,
		soldout_count: null,
		is_discount: false,
		price_base_ex_vat: 0.0,
		price_base_inc_vat: 0.0,
		price_base_ex_vat_label: '',
		price_base_inc_vat_label: '',
		creation_date: null,
		modification_date: null,
		name: '',
		description: '',
		header: '',
		type: null,
		main_media_id: null,
		slug: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		text1: '',
		text2: '',
		text3: '',
		text4: '',
		text5: '',
		text6: '',
		text7: '',
		text8: '',
		text9: '',
		text10: '',
		text11: '',
		text12: '',
		text13: '',
		text14: '',
		text15: '',
		categories: [],
		variants: [],
		images: []
	},

	/**
	 * Return all post types
	 *
	 * @param {Object} options :
	 * 						- {Boolean} structure : fetch structure
	 * @returns {Promise}
	 */
	getTypes: function(options) {

		options = options || {};

		var data = {};
		if (options.structure) {
			data.extra_fields = 'structure';
		}

		return Backbone.ajax({
			url: 'sites/@site/catalog/products_types',
			data: data
		}).then(function(response) {
			return _.map(response.data, function(type) {
				return {
					type: type.type,
					name: type.name,
					position: type.position,
					fields: type.fields || []
				};
			});
		});
	},

	/**
	 * Duplicate current product
	 *
	 * @return {Promise}
	 */
	duplicate: function(attributes) {
		var that = this;
		return Backbone.ajax({
			url: 'sites/@site/catalog/products/' + this.get('product_id'),
			method: 'POST',
			data: attributes
		}).then(function(response) {
			var copy = that.clone();
			copy.set(copy.parse(response));
			return copy;
		});
	}

});
