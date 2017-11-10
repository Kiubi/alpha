var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'catalog',
	behaviors: [FormBehavior],

	fields: [
		'currency',
		'comments_allowed',
		'comments_captcha',
		'comments_anonymous',
		'comments_autopublish',
		'require_auth'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
