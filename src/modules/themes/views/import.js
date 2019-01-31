var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var FileView = require('kiubi/core/views/ui/input.file.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.html'),
	className: 'container',
	service: 'themes',

	behaviors: [FormBehavior],

	events: {
		"change input[type=file]": "dropFile"
	},

	regions: {
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'with_content',
		'copyrights_acquired'
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

		if (this.step > 0) return;

		// FileInput
		this.showChildView('file', new FileView());

	},

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showOverlay();

		var data = Forms.extractFields(this.fields, this);
		data.file = this.getChildView('file').getFile();

		return this.model.import(data).done(function(report) {
			this.step = 1;
			this.report = report;
			this.render();
		}.bind(this)).always(function() {
			navigationController.hideModal();
		});
	},

	onCancel: function(event) {

		if (this.step == 0) {
			// navigation /modules
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.navigate('/themes');
		} else {
			this.step = 0;
			this.report = null;
			this.render();
		}

	}

});
