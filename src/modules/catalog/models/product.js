var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/products',
	idAttribute: 'product_id',

	previewLink: null,

	parse: function(response) {
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

			return response.data;
		}
		return response;
	},

	defaults: {

		product_id: null,
		is_spotlight: false,
		available_date: '',
		available_date_f: '',
		is_visible: false,
		stock: '',
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
		creation_date: '',
		creation_date_f: '',
		creation_date_timestamp: null,
		modification_date: '',
		modification_date_f: '',
		modification_date_timestamp: null,
		name: '',
		description: '',
		header: '',
		type: '',
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
		categories: []
	}

});
