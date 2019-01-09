var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var SelectView = require('kiubi/core/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/ftp.html'),
	className: 'container',
	service: 'media',

	behaviors: [FormBehavior],

	regions: {
		'folder': {
			el: "div[data-role='folder']",
			replaceElement: true
		}
	},

	ui: {
		'summary': '[data-role="summary"]'
	},

	fields: [
		'folder_id'
	],

	step: 0,
	report: null,

	initialize: function(options) {
		this.mergeOptions(options, ['folders', 'model']);

		this.listenTo(this.model, 'sync', this.render);

		this.promisedFolders = this.folders.promisedSelect();
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step,
			summary: this.model.get('summary'),
			summary_count: this.model.get('summary') ? format.plural(this.model.get('summary').count, '%d fichier',
				'%d fichiers') : '',
			summary_size: this.model.get('summary') && this.model.get('summary').size ? format.formatBytes(this.model.get(
				'summary').size, 2) : ''
		};
	},

	onRender: function() {

		if (this.step == 0) {
			this.showChildView('folder', new SelectView({
				collectionPromise: this.promisedFolders,
				name: 'folder_id'
			}));
		}

	},

	start: function() {
		this.model.fetch();
	},

	// Categories

	onSave: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (this.step == 0) {

			var data = Forms.extractFields(this.fields, this);
			navigationController.showOverlay();

			return this.model.import(data).done(function(report) {
				this.step = 1;
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
