var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/blog/home',

	isNew: function() {
		return false;
	},

	defaults: {
		name: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		is_visible: true,
		modification_date: '',
		service_path: ''
	}

});
