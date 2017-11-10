var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var SelectView = require('kiubi/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: require('../templates/settings.html'),
	className: 'container',
	service: 'customers',

	behaviors: [FormBehavior],

	fields: [
		'allow_registration',
		'allow_login',
		'validation',
		'default_group_id',
		'terms'
	],

	regions: {
		groups: {
			el: "select[data-role='groups']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'groups']);
	},

	onRender: function() {
		this.showChildView('groups', new SelectView({
			collection: this.groups,
			selected: this.model.get('default_group_id'),
			name: 'default_group_id'
		}));
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
