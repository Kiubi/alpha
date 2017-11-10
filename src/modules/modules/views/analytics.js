var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/analytics.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	fields: [
		'UA',
		'is_enabled',
		'type',
		'target',
		'options'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
