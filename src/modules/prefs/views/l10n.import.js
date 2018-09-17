var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var SelectView = require('kiubi/views/ui/select.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/l10n.import.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	events: {
		"change input[type=file]": "dropFile"
	},

	fields: [
		'type'
	],

	step: 0,
	tempfileUpload: null,
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

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showOverlay();

		var data = Forms.extractFields(this.fields, this);
		data.file = this.tempfileUpload;

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
			navigationController.navigate('/modules');
		} else {
			this.step = 0;
			this.report = null;
			this.tempfileUpload = null;
			this.render();
		}

	}

});
