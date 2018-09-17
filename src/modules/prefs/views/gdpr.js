var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/gdpr.html'),
	className: 'container',
	service: 'prefs',

	behaviors: [FormBehavior],

	fields: [
		'is_customers_consent_required',
		'is_comments_consent_required',
		'is_evaluations_consent_required',
		'is_newsletter_consent_required',
		'is_checkout_consent_required'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
