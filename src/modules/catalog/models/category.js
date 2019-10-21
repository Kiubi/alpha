var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

module.exports = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/catalog/categories',
	idAttribute: 'category_id',

	defaults: {

		category_id: null,
		name: '',
		description: '',
		media_id: null,
		is_visible: false,
		is_main: false,
		slug: '',
		product_count: null,
		creation_date: '',
		creation_date_f: '',
		creation_date_timestamp: null,
		modification_date: '',
		modification_date_f: '',
		modification_date_timestamp: null,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		service_path: ''
	}

});
