var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/https.html'),
	className: 'container',
	service: 'prefs',

	behaviors: [FormBehavior],

	fields: ['is_enabled'],

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	templateContext: function() {
		return {
			fqdn: Session.site.get('domain').replace(/^https?:\/\//, '')
		};
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		);
	}

});
