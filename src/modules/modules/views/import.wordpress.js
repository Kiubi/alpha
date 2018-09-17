var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/views/ui/select.js');
var FileView = require('kiubi/views/ui/input.file.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.wordpress.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	events: {
		"change input[type=file]": "dropFile"
	},

	regions: {
		type: {
			el: 'div[data-role="type"]',
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'is_enabled',
		'url',
		'login',
		'password',
		'import_pages',
		'import_media',
		'thumbnail',
		'medium',
		'large',
		'type'
	],

	step: 0,
	report: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'post']);
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step
		};
	},

	onRender: function() {

		if (this.step > 0) return;

		// Type

		this.showChildView('type', new SelectView({
			collectionPromise: this.post.promisedTypes(),
			name: 'type'
		}));

		this.showChildView('file', new FileView());
	},

	onSave: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (this.step == 0) {

			var data = Forms.extractFields(this.fields, this);

			data.file = this.getChildView('file').getFile();
			navigationController.showOverlay();

			return this.model.analyse(data).done(function(report) {
				this.step = 1;
				this.report = report;
				this.render();
			}.bind(this)).always(function() {
				navigationController.hideModal();
			});

		} else {
			navigationController.showOverlay();

			return this.model.import(this.report.token).done(function(report) {
				this.step = 2;
				this.report = report;
				this.render();
			}.bind(this)).always(function() {
				navigationController.hideModal();
			});

		}
	},

	onCancel: function(event) {

		if (this.step == 0) {
			// navigation /modules
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.navigate('/modules');
		} else {
			this.step = 0;
			this.report = null;
			this.render();
		}

	}

});
