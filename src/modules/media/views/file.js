var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var _ = require('underscore');

var SelectView = require('kiubi/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/file.html'),
	className: 'container',
	service: 'media',

	behaviors: [FormBehavior],

	regions: {
		folder: {
			el: "div[data-role='folder']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'description',
		'folder_id'
	],

	tempfileUpload: null,

	events: {
		"change input[type=file]": "dropFile"
	},

	render_counter: 1,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'folder', 'folders']);

		this.listenTo(this.model, 'change:folder_id', this.onFolderChange);

	},

	templateContext: function() {
		return {
			last_date: format.formatDateTime(this.model.get('modification_date')),
			size: format.formatBytes(this.model.get('weight'), 2),
			convertMediaPath: Session.convertMediaPath.bind(Session),
			render_counter: this.render_counter++ // Hack to force image reload on upload
		};
	},

	onRender: function() {
		this.showChildView('folder', new SelectView({
			collection: this.folders,
			selected: this.model.get('folder_id'),
			name: 'folder_id'
		}));
	},

	onFolderChange: function() {
		this.folder.clear({
			silent: true
		});
		this.folder.set('folder_id', this.model.get('folder_id'));
		this.folder.fetch();
	},

	onSave: function() {

		var fields = Forms.extractFields(this.fields, this);
		if (this.tempfileUpload) {
			fields.file = this.tempfileUpload;
		}

		return this.model.save(fields, {
			patch: true,
			wait: true
		}).done(function() {
			// Re-render to update file preview
			this.render();
		}.bind(this));
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	},

	dropFile: function(event) {
		if (Backbone.$(event.target).is('input[type=file]')) {
			// stop la propagation de l'event 
			event.stopPropagation();
		}

		event.preventDefault();

		var dataTransfer = event.originalEvent.dataTransfer;
		var files = (dataTransfer ? dataTransfer.files : event.originalEvent.target
			.files);

		_.each(files, function(File) {
			this.tempfileUpload = File;
		}.bind(this));
	}

});
