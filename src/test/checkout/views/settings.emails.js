var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('../../../behaviors/simple_form');
var Forms = require('../../../utils/forms');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.emails.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior],

	fields: [
		'mail_pending',
		'mail_processing',
		'mail_processed',
		'mail_shipped',
		'mail_cancelled'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
