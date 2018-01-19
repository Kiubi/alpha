var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'blog',

	behaviors: [FormBehavior],

	fields: [
		'comments_allowed',
		'comments_anonymous',
		'comments_autopublish',
		'comments_captcha',
		'is_rss_enabled',
		'rss_post_count'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
