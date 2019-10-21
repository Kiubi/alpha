var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/seo/meta',

	isNew: function() {
		return false;
	},

	defaults: {
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: ''
	}

});
