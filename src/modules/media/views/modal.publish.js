var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var ControllerChannel = Backbone.Radio.channel('controller');

var RowView = Marionette.View.extend({
	template: require('../templates/modal.publish.row.html'),
	className: 'list-item',

	events: {
		'click a[data-role="cancel"]': 'cancel'
	},

	modelEvents: {
		'change:upload': 'render'
	},

	cancel: function() {
		this.model.destroy();
	},

	templateContext: function() {
		return {
			uploadPreview: this.model.uploadPreview,
			size: format.formatBytes(this.model.get('weight'), 2),
			uploadProgression: this.model.uploadProgression
		};
	}

});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list list-media mediatheque-uploaded-file',
	childView: RowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/modal.publish.html'),

	ui: {
		"dropzone": "div[data-role='dropzone']"
	},

	events: {
		"drop @ui.dropzone, input[type=file]": "drop",
		"change input[type=file]": "drop",
		"dragenter @ui.dropzone": "dragEnter",
		"dragleave @ui.dropzone": "dragLeave"
	},

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		}
	},

	isMultiFiles: true,

	initialize: function(options) {
		this.mergeOptions(options, ['isMultiFiles']);
	},

	drop: function(event) {
		if (Backbone.$(event.target).is('input[type=file]')) {
			// stop la propagation de l'event à la modal et laisse le
			// drop natif se faire sur les input[type=file]
			event.stopPropagation();
		}

		event.preventDefault();

		// Clean already uploaded
		var cleanList = this.collection.filter(function(model) {
			return model.uploadProgression.status != 'pending';
		});
		if (cleanList.length) {
			this.collection.remove(cleanList);
		}

		var dataTransfer = event.originalEvent.dataTransfer;
		var files = (dataTransfer ? dataTransfer.files : event.originalEvent.target
			.files);

		if (!this.isMultiFiles) {
			this.collection.reset();
			// Limit to only 1 file
			if (files.length > 1) files = files.shift();
		}

		_.each(files, function(File) {
			var model = new this.collection.model();
			model.setFile(File);
			model.set('folder_id', this.collection.folder_id);
			this.collection.add(model);
		}.bind(this));

		if (!this.isMultiFiles) {
			// Trigger immediately in single file mode
			this.onActionModal();
		}
	},

	/**
	 * Entrée sur la zone de drop
	 */
	dragEnter: function(event) {
		event.preventDefault();
	},

	/**
	 * Sortie de la zone de drop
	 */
	dragLeave: function(event) {
		event.preventDefault();
	},

	onActionModal: function() {
		this.collection.upload().always(function() {
			ControllerChannel.trigger('uploaded:files', this.collection.folder_id);
			this.trigger('uploaded:files', this.collection);
		}.bind(this));
	},

	templateContext: function() {
		var canDragAndDrop = true;
		var ua = (navigator.userAgent || navigator.vendor || window.opera);
		if (ua.match(/iPad/i) ||
			ua.match(/iPod/i) ||
			ua.match(/iPhone/i) ||
			ua.match(/Android/i)) {
			canDragAndDrop = false;
		}
		return {
			canDragAndDrop: canDragAndDrop,
			isMultiFiles: this.isMultiFiles
		};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection
		}));
	}

});
