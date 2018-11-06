var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var PublishModalView = require('kiubi/modules/media/views/modal.publish.js');
var SelectModalView = require('kiubi/modules/media/views/modal.picker');
var WysiwygModalView = require('kiubi/modules/media/views/modal.picker.wysiwyg');

var Files = require('kiubi/modules/media/models/files');
var Page = require('kiubi/modules/cms/models/page');

var WysiwygChannel = Backbone.Radio.channel('wysiwyg');
var ControllerChannel = Backbone.Radio.channel('controller');
var Session = Backbone.Radio.channel('app').request('ctx:session');


function addSign(match, media) {
	var id = media.match(/(^|\/)([0-9]+)($|\/|\.)/);
	if (id) {
		var sign = Session.hashMedia(parseInt(id[2]));
		return 'src="https://' + Session.site.get('backoffice') + '/media/' + media + '?sign=' + sign + '"';
	}
	return match;
}

function removeSign(match, media) {
	media = media.replace(/(\?|\&)sign=[-a-zA-Z0-9]+/, '');
	return 'src="/media/' + media + '"';
}

require('tinymce');
var tinyMCE = window.tinyMCE;

// i18n
require('kiubi/locales/fr/tinymce.js');

// Theme
require('tinymce/themes/modern/theme.js');
// Plugins
require('tinymce/plugins/lists/plugin.js');
require('tinymce/plugins/paste/plugin.js');
require('kiubi/vendor/tinymce/plugins/link/plugin.js');
require('tinymce/plugins/charmap/plugin.js');
require('tinymce/plugins/code/plugin.js');
require('tinymce/plugins/anchor/plugin.js');
require('tinymce/plugins/table/plugin.js');
require('tinymce/plugins/textcolor/plugin.js');
require('tinymce/plugins/colorpicker/plugin.js');
require('tinymce/plugins/fullscreen/plugin.js');
require('tinymce/plugins/image/plugin.js');
require('tinymce/plugins/contextmenu/plugin.js');
require('tinymce/plugins/media/plugin.js');
// Plugins Mediathèque
tinyMCE.PluginManager.add('kiubi', function(editor, url) {
	// Add a button that opens a window
	editor.addButton('kiubi_media', {
		tooltip: "Médiathèque",
		icon: 'image',
		onclick: function() {
			WysiwygChannel.trigger('open:media', editor);
		}
	});
	editor.on('BeforeSetContent', function(e) {
		e.content = e.content.replace(/src="\/media\/([^"]+)"/, addSign);
	});
	editor.on('GetContent', function(e) {
		var reg = new RegExp('src="https://' + Session.site.get('backoffice') + '/media/([^"]+)"', 'i');
		e.content = e.content.replace(reg, removeSign);
	});
});


/**
 * Generate HTML for file insertion
 *
 * @param {Backbone.Model} file
 * @param {Object} settings
 * @returns {string}
 */
function settingToHTML(file, settings) {
	var html = '';

	if (file.get('type') == 'image' &&
		settings.integration_type &&
		settings.integration_type == 'inline') {

		var handler = '';

		switch (settings.image_variant) {
			case 'g_vignette':
				handler = '/g_vignette';
				break;
			case 'vignette':
				handler = '/vignette';
				break;
			case 'g_miniature':
				handler = '/g_miniature';
				break;
			case 'miniature':
				handler = '/miniature';
				break;
		}

		var align = '';

		switch (settings.image_align) {
			case 'left':
			case 'right':
			case 'middle':
				align = settings.image_align;
				break;
		}

		html = '<img src="/media' + handler + '/' + file.get('media_id') + '" ' +
			((align != '') ? ' align="' + align + '" ' : '') +
			((settings.image_height != '' && !isNaN(parseFloat(settings.image_height))) ?
				' height="' + parseFloat(settings.image_height) + 'px" ' : '') +
			((settings.image_width != '' && !isNaN(parseFloat(settings.image_width))) ?
				' width="' + parseFloat(settings.image_width) + 'px" ' : '') +
			((settings.class != '') ? ' class="' + _.escape(settings.class) + '" ' : '') +
			' style="' +
			((settings.margin_top != '' && !isNaN(parseFloat(settings.margin_top))) ?
				' margin-top:' + parseFloat(settings.margin_top) + 'px;' : '') +
			((settings.margin_right != '' && !isNaN(parseFloat(settings.margin_right))) ?
				' margin-right:' + parseFloat(settings.margin_right) + 'px;' : '') +
			((settings.margin_left != '' && !isNaN(parseFloat(settings.margin_left))) ?
				' margin-left:' + parseFloat(settings.margin_left) + 'px;' : '') +
			((settings.margin_bottom != '' && !isNaN(parseFloat(settings.margin_bottom))) ?
				' margin-bottom:' + parseFloat(settings.margin_bottom) + 'px;' : '') +
			'"' +
			((settings.alt != '') ? ' alt="' + _.escape(settings.alt) + '" ' : '') + ' ' +
			((settings.title != '') ? ' title="' + _.escape(settings.title) + '" ' : '') +
			' ' +
			' />';
	} else {
		html = '<a';
		html += ' href="/media/' + file.get('media_id') + '" target="_blank"';
		if (settings.class) html += ' class="' + _.escape(settings.class) + '"';
		if (settings.title) html += ' title="' + _.escape(settings.title) + '"';
		html += '>Télécharger le fichier</a>';
	}

	var info_sup = [];
	if (settings.xtra_author) {
		// info_sup.push(' '); // TODO author
	}
	if (settings.xtra_file) {
		info_sup.push(file.get('original_name'));
	}
	if (settings.xtra_name) {
		info_sup.push(file.get('name'));
	}
	if (settings.xtra_modification) {
		info_sup.push(format.formatDateTime(this.model.get('modification_date')));
	}
	if (settings.xtra_weight) {
		info_sup.push(format.formatBytes(file.get('weight'), 2));
	}
	if (settings.xtra_size && file.get('type') == 'image') {
		info_sup.push('' + file.get('width') + ' x ' + file.get('height'));
	}
	if (info_sup.length > 0) html += ' (' + info_sup.join(' ') + ')';

	return html;
}


module.exports = Marionette.Behavior.extend({

	options: {
		selector: 'textarea[data-role="wysiwyg"]'
	},

	editorList: [],

	initialize: function(options) {
		this.mergeOptions(options);

		this.listenTo(WysiwygChannel, 'open:media', this.openMedia);
	},

	onDomRefresh: function() {

		// DOM nodes were thrown away, no other choice that destroying previous editors
		this.clearAllWysiwyg();

		var that = this;
		Backbone.$(this.options.selector, this.view.$el).each(function(index, target) {
			that.createWysiwyg(target).then(function(editors) {
				if (editors.length > 0) that.editorList.push(editors[0]);
			});
		});
	},

	/**
	 * Create a Wysisyg on targeted DOM Element. Check data attributs for customization
	 * 	 - data-wysiwyg-toolbar : [|mini]
	 *
	 * @param {Element} target
	 * @returns {Promise}
	 */
	createWysiwyg: function(target) {
		var plugins;
		var toolbar;

		var $target = Backbone.$(target);
		var adjusted_height = $target.height(); // Will remove toolbar height to match base textarea height
		switch ($target.data('wysiwyg-toolbar')) {
			case 'micro':
				plugins = ['image', 'contextmenu', 'kiubi', 'lists', 'paste', 'link', 'charmap', 'code'];
				toolbar =
					'bold italic underline strikethrough | numlist bullist | pastetext | link unlink | kiubi_media | removeformat undo redo | code';
				adjusted_height -= 68;
				break;

			default:
				plugins = ['image', 'contextmenu', 'kiubi', 'media', 'lists', 'paste', 'textcolor',
					'colorpicker', 'link', 'anchor', 'table', 'charmap', 'code'
				];
				toolbar = [
					'formatselect fontsizeselect | bold italic underline strikethrough superscript | alignleft aligncenter alignright alignjustify | forecolor backcolor | numlist bullist | outdent indent | pastetext | link unlink | kiubi_media media table | removeformat undo redo | code'
				];
				adjusted_height -= 102;
				break;
		}

		var that = this;

		return tinyMCE.init({
			target: target,
			height: adjusted_height,
			skin_url: '/vendor/tinymce/skins/lightgray',
			language: 'fr_FR',
			language_url: false,
			convert_urls: false,
			menu: {},
			custom_undo_redo_levels: 20,
			forced_root_block: false, // Beware, potential breaking
			block_formats: 'Paragraphe=p;Titre 1=h1;Titre 2=h2;Titre 3=h3;Titre 4=h4;Titre 5=h5;Titre 6=h6;Preformatted=pre;DIV=div',
			plugins: plugins,
			toolbar: toolbar,
			contextmenu: "",
			fontsize_formats: '8px 10px 12px 14px 18px 24px 36px',
			branding: false,
			link_list: {
				types: this.link_types.bind(this),
				pages: this.link_pages.bind(this)
			},
			extended_valid_elements: 'style[type],script[language|type|src],span[*]',
			valid_children: "+body[style], +div[style], +span[*]",
			init_instance_callback: function(editor) {
				editor.on('Change', function(e) {
					that.view.triggerMethod('field:change');
				});
				editor.on('KeyDown', function(e) {
					if (e.key == 's' && e.metaKey) {
						e.preventDefault();
						ControllerChannel.trigger('meta:s:shortcut');
						return false;
					}
				});
			}
		});
	},

	link_types: function(callback) {
		var p = new Page();
		p.getInternalLinkTypes().done(function(types) {
			callback(types.map(function(model) {
				return {
					value: model.get('value'),
					title: model.get('label')
				};
			}));
		});
	},

	link_pages: function(type, callback) {
		var p = new Page();
		p.getInternalLinkTargets(type).done(function(targets) {
			callback(_.map(targets, function(target) {
				var indent = '';
				if (target.depth && target.depth > 0) {
					for (var i = 0; i < target.depth; i++) {
						indent = '  ' + indent;
					}
				}
				return {
					value: target.url,
					text: indent + _.escape(target.name),
					disabled: (target.url == null)
				};
			}));
		});
	},

	clearAllWysiwyg: function() {
		_.each(this.editorList, function(editor) {
			tinymce.remove(editor);
		});
		this.editorList = [];
	},

	onBeforeDestroy: function() {
		this.clearAllWysiwyg();
	},

	onBeforeSave: function() {
		_.each(this.editorList, function(editor) {
			editor.save();
		});
	},

	/**
	 *
	 * @param {tinymce} editor
	 */
	openMedia: function(editor) {
		var match = _.find(this.editorList, function(match) {
			return match == editor;
		});
		if (match !== editor) return; // don't react to a editor from another behavior

		var collection = new Files();
		collection.folder_id = 2; // TODO Fix
		var model = new(new Files()).model();

		var contentView = new SelectModalView({
			collection: collection,
			model: model,
			type: 'file'
		});

		this.listenTo(contentView, 'close:modal', function() {
			this.setupMedia(editor, contentView.model);
		});

		this.listenTo(contentView, 'action:modal', function(view) {
			this.switchToPublish(editor, view.currentFolder);
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier'
			}
		});
	},

	/**
	 *
	 * @param {tinymce} editor
	 * @param {Backbone.Model} file
	 */
	setupMedia: function(editor, file) {

		var contentView = new WysiwygModalView({
			model: file
		});

		this.listenTo(contentView, 'insert:file', function(settings) {
			editor.insertContent(settingToHTML(file, settings));
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: file.get('name'),
			modalClass: 'mediatheque modal-right',
			modalDialogClass: 'modal-lg',
			action: {
				title: 'Insérer'
			}
		});

	},

	/**
	 *
	 * @param {tinymce} editor
	 * @param {Number} currentFolder
	 */
	switchToPublish: function(editor, currentFolder) {
		var collection = new Files();
		collection.folder_id = currentFolder;
		var contentView = new PublishModalView({
			isMultiFiles: false,
			collection: collection
		});

		this.listenTo(contentView, 'uploaded:files', function(collection) {
			this.onUploadedFiles(editor, collection);
		});

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
	 * @param {tinymce} editor
	 * @param {Backbone.Collection} collection
	 */
	onUploadedFiles: function(editor, collection) {
		var uploadedList = collection.find(function(model) {
			return model.uploadProgression.status == 'done';
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (!uploadedList) {
			navigationController.hideModal();
			return;
		}

		uploadedList.fetch()
			.done(function() {
				this.setupMedia(editor, uploadedList);
			}.bind(this))
			.fail(function() {
				navigationController.hideModal();
			});
	}

});
