var Backbone = require('backbone');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/medias',

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
		miniature_height: null,

		// advanced_media
		is_resize_enabled: false,
		max_width: null,
		max_height: null,
		jpg_compression: 85
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;

		return this.fetch().then(function() {

			var c = new CollectionUtils.SelectCollection();
			c.add([{
					'value': 'full',
					'label': 'Taille d\'origine',
					'selected': selected == 'full' || !selected
				},
				{
					'value': 'g_vignette',
					'label': 'Grande vignette : ' + that.get('g_vignette_width') + ' x ' + that.get('g_vignette_height') + 'px',
					'selected': selected == 'g_vignette'
				},
				{
					'value': 'vignette',
					'label': 'Vignette : ' + that.get('vignette_width') + ' x ' + that.get('vignette_height') + 'px',
					'selected': selected == 'vignette'
				},
				{
					'value': 'g_miniature',
					'label': 'Grande miniature : ' + that.get('g_miniature_width') + ' x ' + that.get('g_miniature_height') +
						'px',
					'selected': selected == 'g_miniature'
				},
				{
					'value': 'miniature',
					'label': 'Miniature : ' + that.get('miniature_width') + ' x ' + that.get('miniature_height') + 'px',
					'selected': selected == 'miniature'
				}
			]);

			return c;
		});
	}

});
