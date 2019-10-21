var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/theme',

	isNew: function() {
		return false;
	},

	defaults: {
		site_excerpt: '',
		is_excerpt_visible: false,
		site_description: '',
		is_description_visible: false,
		logo_media_id: null,
		is_logo_visible: false
	}

});
