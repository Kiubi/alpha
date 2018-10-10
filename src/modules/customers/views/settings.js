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
		'terms',
		'processing_purposes'
	],

	regions: {
		groups: {
			el: "div[data-role='groups']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'groups']);
	},

	templateContext: function() {
		return {
			enableExtranet: this.getOption('enableExtranet')
		};
	},

	onRender: function() {
		if (this.getOption('enableExtranet')) {
			this.showChildView('groups', new SelectView({
				collection: this.groups,
				selected: this.model.get('default_group_id'),
				name: 'default_group_id',
				emptyLabel: 'Aucun groupe'
			}));
		}
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		data.allow_registration = (data.allow_registration == '1'); // manual boolean casting
		data.allow_login = (data.allow_login == '1'); // manual boolean casting

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	}

});
