var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FileView = require('kiubi/core/views/ui/input.file.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/import/mondialrelay.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	regions: {
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	events: {
		"change input[type=file]": "dropFile"
	},

	fields: [
		'notify'
	],

	step: 0,
	report: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step
		};
	},

	onRender: function() {

		if (this.step == 0) {

			this.showChildView('file', new FileView());
		}

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
