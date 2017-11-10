var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('../../../behaviors/simple_form');
var Forms = require('../../../utils/forms');
var SelectView = require('../../../views/ui/select');

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
