var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var SelectView = require('kiubi/core/views/ui/select.js');
var FileView = require('kiubi/core/views/ui/input.file.js');

module.exports = Marionette.View.extend({
	template: require('../templates/customer.html'),
	className: 'container',
	service: 'customers',

	behaviors: [FormBehavior],

	regions: {
		groups: {
			el: "div[data-role='groups']",
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	ui: {
		'showPwdBtn': 'a[data-role="show-password"]',
		'pwdInput': 'input[name="password"]'
	},

	events: {
		'click @ui.showPwdBtn': function() {
			this.getUI('showPwdBtn').hide();
			this.getUI('pwdInput').show();
		}
	},

	fields: [
		'is_enabled',
		'firstname',
		'lastname',
		'gender',
		'email',
		'website',
		'nickname',
		'group_id'
	],

	render_counter: 1,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'groups']);
	},

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			render_counter: this.render_counter++, // Hack to force image reload on upload
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			enableExtranet: this.getOption('enableExtranet')
		};
	},

	onRender: function() {
		if (this.getOption('enableExtranet')) {
			this.showChildView('groups', new SelectView({
				emptyLabel: 'Aucun groupe',
				collection: this.groups,
				selected: this.model.get('group_id'),
				name: 'group_id',
				direction: 'up'
			}));
		}
		this.showChildView('file', new FileView({
			name: 'avatar'
		}));
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		if (this.getUI('pwdInput').val() != '') {
			data.password = this.getUI('pwdInput').val();
		}
		if (this.getChildView('file').getFile()) {
			data.avatar = this.getChildView('file').getFile();
		}

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		).done(function() {
			// Re-render to update file preview
			this.render();
		}.bind(this));
	},

	onDelete: function() {
		return this.model.destroy();
	}

});
