var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({
	url: 'sites/@site/cms/home',
	idAttribute: 'page_id',

	defaults: {
		page_id: null,
		name: '',
		is_visible: false,
		is_home: false,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		layout_id: null,
		service_path: ''
	},

	getTitle: function() {
		return this.get('name');
	},

	getBackURL: function() {
		return '/cms';
	}

});
