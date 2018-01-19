var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var SelectView = require('kiubi/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: require('../templates/customer.html'),
	className: 'container',
	service: 'customers',

	behaviors: [FormBehavior],

	regions: {
		groups: {
			el: "div[data-role='groups']",
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
		},
		"change input[type=file]": "dropFile"
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

	tempfileUpload: null,
	render_counter: 1,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'groups']);
	},

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			render_counter: this.render_counter++ // Hack to force image reload on upload
		};
	},

	onRender: function() {
		this.showChildView('groups', new SelectView({
			emptyLabel: 'Aucun groupe',
			collection: this.groups,
			selected: this.model.get('group_id'),
			name: 'group_id',
			direction: 'up'
		}));
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		if (this.getUI('pwdInput').val() != '') {
			data.password = this.getUI('pwdInput').val();
		}
		if (this.tempfileUpload) {
			data.avatar = this.tempfileUpload;
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

	dropFile: function(event) {
		if (Backbone.$(event.target).is('input[type=file]')) {
			// stop la propagation de l'event
			event.stopPropagation();
		}

		event.preventDefault();

		var dataTransfer = event.originalEvent.dataTransfer;
		var files = (dataTransfer ? dataTransfer.files : event.originalEvent.target.files);

		_.each(files, function(File) {
			this.tempfileUpload = File;
		}.bind(this));
	},

	onDelete: function() {
		return this.model.destroy();
	}

});
