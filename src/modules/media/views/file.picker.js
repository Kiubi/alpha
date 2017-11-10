var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var File = require('kiubi/modules/media/models/file.js');
var Files = require('kiubi/modules/media/models/files.js');

var PublishModalView = require('kiubi/modules/media/views/modal.publish.js');
var SelectModalView = require('kiubi/modules/media/views/modal.picker.js');

module.exports = Marionette.View.extend({
	template: require('../templates/file.picker.html'),
	className: 'form-group',

	fieldname: '',
	fieldLabel: '',
	type: 'image', // image || file
	value: '',
	model: null,

	ui: {
		'selectBtn': 'a[data-role="select"]',
		'clearBtn': 'a[data-role="clear"]'
	},

	events: {
		'click @ui.selectBtn': 'select',
		'click @ui.clearBtn': function() {
			this.model.clear();
			this.render();
		}
	},

	modelEvents: {
		'sync': 'render',
		'change': 'render'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['fieldname', 'value', 'type', 'fieldLabel']);

		this.model = new File();
		if (this.value > 0) {
			this.model.set('media_id', this.value);
			this.model.fetch();
		}
	},

	templateContext: function() {
		return {
			fieldname: this.fieldname,
			fieldLabel: this.fieldLabel,
			file: this.model.get('media_id') > 0 ? this.model.toJSON() : null,
			value: this.model.get('media_id')
		};
	},

	select: function() {
		var collection = new Files();
		var contentView = new SelectModalView({
			type: this.type,
			model: this.model,
			collection: collection
		});

		this.listenTo(contentView, 'action:modal', this.switchToPublish);

		var navigationController = Backbone.Radio.channel('app').request(
			'ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier un fichier'
			}
		});
	},

	/**
	 * 
	 * @param {Marionette.View} view
	 */
	switchToPublish: function(view) {

		var collection = new Files();
		collection.folder_id = view.currentFolder;
		var contentView = new PublishModalView({
			isMultiFiles: false,
			collection: collection
		});

		this.listenTo(contentView, 'uploaded:files', this.onUploadedFiles);

		var navigationController = Backbone.Radio.channel('app').request(
			'ctx:navigationController');

		navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier un fichier'
			}
		});

	},

	/**
	 * 
	 * @param {Backbone.Collection} collection
	 */
	onUploadedFiles: function(collection) {
		var uploadedList = collection.find(function(model) {
			return model.uploadProgression.status == 'done';
		});

		if (uploadedList) {
			this.model.set(uploadedList.toJSON());
		}

		var navigationController = Backbone.Radio.channel('app').request(
			'ctx:navigationController');
		navigationController.hideModal();
	}

});
