var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/medias.html'),
	className: 'container',
	service: 'prefs',

	behaviors: [FormBehavior],

	ui: {
		'pwdBtn': 'a[data-role="password-toggle"]',
		'pwdMask': 'span[data-role="password-mask"]'
	},

	events: {
		'click @ui.pwdBtn': function() {
			this.getUI('pwdBtn').hide();
			this.getUI('pwdMask').show();
		}
	},

	fields: [
		'g_vignette_width',
		'g_vignette_height',
		'vignette_width',
		'vignette_height',
		'g_miniature_width',
		'g_miniature_height',
		'miniature_width',
		'miniature_height'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'ftp']);
	},

	templateContext: function() {
		return {
			ftp: this.ftp.toJSON()
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
