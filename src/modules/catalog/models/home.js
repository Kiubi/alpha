var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/catalog/home',

	isNew: function() {
		return false;
	},

	defaults: {
		name: '',
		description: '',
		is_visible: false,
		modification_date: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		service_path: ''
	}

});
