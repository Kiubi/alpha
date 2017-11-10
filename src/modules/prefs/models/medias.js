var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/medias',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		g_vignette_width: null,
		g_vignette_height: null,
		vignette_width: null,
		vignette_height: null,
		g_miniature_width: null,
		g_miniature_height: null,
		miniature_width: null,
		miniature_height: null
	}

});
