var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/input.file.html'),
	tagName: 'div',
	className: 'input-file',

	name: 'file',
	tempfileUpload: null,

	ui: {
		'filename': '[data-role="filename"]'
	},

	events: {
		"change input[type=file]": "dropFile"
	},

	initialize: function(options) {
		this.mergeOptions(options, ['name']);
	},

	templateContext: function() {
		return {
			'name': this.name
		};
	},

	updateView: function(filename) {
		this.getUI('filename').text(filename);
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

		if (this.tempfileUpload) {
			this.updateView(this.tempfileUpload.name);
		}
	},

	getFile: function() {
		return this.tempfileUpload;
	},

	/**
	 * @return {Promise}
	 */
	getFileContent: function() {
		var promise = Backbone.$.Deferred();

		var reader = new FileReader();
		reader.onload = function(evt) {
			promise.resolve(evt.target.result);
		};
		reader.onerror = function(evt) {
			promise.reject();
		};
		reader.readAsText(this.tempfileUpload, "UTF-8");

		return promise;
	}

});
