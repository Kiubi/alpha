var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/core/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.files.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	regions: {
		folder: {
			el: "div[data-role='folder']",
			replaceElement: true
		}
	},

	fields: [
		'url',
		'folder_id',
		'unzip',
		'max_width',
		'max_height',
		'jpg_compression'
	],

	step: 0,
	report: null,
	folders: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'folders', 'prefs']);
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step,
			max_width: this.prefs.get('max_width') ? this.prefs.get('max_width') : '',
			max_height: this.prefs.get('max_height') ? this.prefs.get('max_height') : '',
			jpg_compression: this.prefs.get('jpg_compression') ? this.prefs.get('jpg_compression') : ''
		};
	},

	onRender: function() {

		if (this.step > 0) return;

		this.showChildView('folder', new SelectView({
			collection: this.folders,
			name: 'folder_id'
		}));
		this.folders.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

	},

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showOverlay();

		var data = Forms.extractFields(this.fields, this);

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
			this.render();
		}

	}

});
