var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Files = require('kiubi/modules/media/models/files.js');

var PublishModalView = require('kiubi/modules/media/views/modal.publish.js');
var SelectModalView = require('kiubi/modules/media/views/modal.picker.js');

module.exports = Marionette.View.extend({
	template: _.template('Ajouter une image'),
	tagName: 'a',
	attributes: {
		"href": "#"
	},

	type: 'image', // image || file

	model: null,

	events: {
		'click': 'select'
	},

	modelEvents: {
		'sync': 'proxySelection',
		'change': 'proxySelection'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['type']);
		this.model = new(new Files()).model();
	},

	proxySelection: function() {
		this.triggerMethod('selected:file', this.model.toJSON());
	},

	select: function() {
		this.model.clear({
			silent: true
		});

		var collection = new Files();
		var contentView = new SelectModalView({
			type: this.type,
			model: this.model,
			collection: collection
		});

		this.listenTo(contentView, 'action:modal', this.switchToPublish);

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
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

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

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

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.hideModal();
	}

});
