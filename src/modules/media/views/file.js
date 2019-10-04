var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var SelectView = require('kiubi/core/views/ui/select.js');
var FileView = require('kiubi/core/views/ui/input.file.js');

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
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'description',
		'folder_id'
	],

	render_counter: 1,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'folder', 'folders']);

		this.listenTo(this.model, 'change:folder_id', this.onFolderChange);
	},

	templateContext: function() {
		return {
			last_date: format.formatLongDateTime(this.model.get('modification_date')),
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
		this.showChildView('file', new FileView());
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
		if (this.getChildView('file').getFile()) {
			var file = this.getChildView('file').getFile();
			fields.file = file;
			fields.name = file.name;
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
	}

});
