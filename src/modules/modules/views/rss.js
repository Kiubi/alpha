var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/rss.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	fields: [
		'is_enabled',
		'post_count'
	],

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
