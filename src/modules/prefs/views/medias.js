var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/medias.html'),
	className: 'container',
	service: 'prefs',

	behaviors: [FormBehavior],

	fields: [
		'g_vignette_width',
		'g_vignette_height',
		'vignette_width',
		'vignette_height',
		'g_miniature_width',
		'g_miniature_height',
		'miniature_width',
		'miniature_height',

		// enableAdvanced
		'max_height',
		'max_width',
		'is_resize_enabled',
		'jpg_compression'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'enableAdvanced']);
	},

	templateContext: function() {
		return {
			enableAdvanced: this.enableAdvanced
		};
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
