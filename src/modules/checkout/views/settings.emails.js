var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.emails.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior, WysiwygBehavior],

	fields: [
		'mail_pending',
		'mail_processing',
		'mail_processed',
		'mail_shipped',
		'mail_cancelled',
		'mail_recipients'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
