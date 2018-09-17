var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Controller = require('kiubi/controller.js');

/* Models */
var Folders = require('./models/folders');
var Files = require('./models/files');

/* Views */
var FilesView = require('./views/files');
var FolderView = require('./views/folder');
var FileView = require('./views/file');
var PublishModalView = require('./views/modal.publish');
var MenuTree = require('kiubi/views/ui/menuTree.js');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	if (options.addDownloadFile) {
		actions.push({
			title: 'Télécharger',
			callback: ['actionDownloadFile', options.addDownloadFile] // file_id
		});
	}

	if (options.addDownloadFolder) {
		actions.push({
			title: 'Télécharger',
			callback: ['actionDownloadFolder', options.addDownloadFolder] // folder_id
		});
	}

	if (options.addPublish) {
		actions.push({
			title: 'Publier un fichier',
			callback: ['actionPublish', options.addPublish] // folder_id
		});
	}

	if (options.addFolder) {
		actions.push({
			title: 'Ajouter un dossier',
			callback: ['actionNewFolder', options.addFolder] // parent folder id
		});
	}

	if (options.addSave) {

		var saveAction = {
			title: 'Enregistrer',
			callback: 'actionSave',
			activateOnEvent: 'modified:content',
			bubbleOnEvent: 'modified:content'
		};

		if (actions.length <= 1) {
			actions.push(saveAction);
		} else {
			actions.splice(1, 0, saveAction);
		}

	}

	return actions;
}

function HeaderTabsFolder(folder_id) {
	return [{
		title: 'Contenu du dossier',
		url: '/media/folders/' + folder_id + '/files'
	}, {
		title: 'Paramètres du dossier',
		url: '/media/folders/' + folder_id
	}];
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'media',

	events: {
		'show.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-more').addClass('menu-expand-less');
			this.menuTree.openNode(parseInt(event.target.id.substring(8)));
		},
		'hide.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-less').addClass('menu-expand-more');
			this.menuTree.closeNode(parseInt(event.target.id.substring(8)));
		},
		'click a': function(event) {
			var $link = Backbone.$(event.currentTarget);
			if ($link.attr('href') == '#') return; // Not a treemenu link
			Backbone.$('a', this.el).parent().removeClass('active');
			$link.parent().addClass('active');
		}
	},

	folder_id: -1,

	initialize: function(options) {
		this.collection = new Folders();

		this.fetchAndRender();

		var that = this;
		this.menuTree = new MenuTree({
			nodeInfo: function(model) {
				return {
					url: '/media/folders/' + model.get('folder_id') + '/files',
					name: model.get('name'),
					is_active: model.get('folder_id') == that.folder_id,
					extraClassname: (model.get('has_restrictions')) ? ' pagetype-extranet' : ''
				};
			}
		});
	},

	onChangeFolder: function(folder_id) {
		if (this.folder_id == folder_id) return;
		this.folder_id = folder_id;
		this.render();
	},

	onRefreshFolders: function() {
		this.fetchAndRender();
	},

	fetchAndRender: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		}).done(function() {
			this.render();
		}.bind(this));
	},

	templateContext: function() {
		return {
			renderMenu: function() {
				if (this.folder_id == -1) return '';
				return this.menuTree.render(this.collection.getMenuTree()).html;
			}.bind(this)
		};
	}


});

var MediaController = Controller.extend({

	sidebarMenuService: 'media',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Médiathèque',
		href: '/media'
	}],

	/*
	 * Files 
	 */

	showIndex: function(queryString) {
		this.navigationController.navigate('/media/folders/2/files' + (queryString ? '?' + queryString : ''));
	},

	showFiles: function(folder_id, queryString) {

		var qs = this.parseQueryString(queryString, {
			'term': null
		});

		var m = new(new Folders()).model({
			folder_id: folder_id
		});

		this.triggerSidebarMenu('change:folder', folder_id);

		var collection = new Files();
		collection.folder_id = folder_id;
		m.fetch().done(function() {
				this.navigationController.showContent(new FilesView({
					collection: collection,
					folders: new Folders(),
					filters: qs
				}));
				this.setHeader({
					title: m.get('name')
				}, getHeadersAction({
					addPublish: m.get('folder_id'),
					addFolder: m.get('folder_id')
				}), HeaderTabsFolder(folder_id));
			}.bind(this))
			.fail(function() {
				// Folder not found !
				this.notFound();
				this.setHeader({
					title: 'Dossier introuvable'
				});
			}.bind(this));
	},

	/*
	 * Folder 
	 */

	showFolder: function(folder_id) {
		var m = new(new Folders()).model({
			folder_id: folder_id
		});
		var collection = new Folders();
		collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		this.triggerSidebarMenu('change:folder', folder_id);

		m.fetch().done(function() {
				var Session = Backbone.Radio.channel('app').request('ctx:session');

				var view = new FolderView({
					model: m,
					folders: collection,
					enableExtranet: Session.hasFeature('extranet')

				});
				this.listenTo(m, 'change', function(model) {
					if (model.hasChanged('name')) {
						this.setBreadCrum({
							title: model.get('name')
						}, true);
					}
					this.triggerSidebarMenu('refresh:folders');
				}.bind(this));
				this.listenTo(m, 'destroy', function() {
					this.navigationController.showOverlay(300);
					this.navigationController.navigate('/media/folders/' + m.get('parent_folder_id') + '/files');
					this.triggerSidebarMenu('refresh:folders');
				});
				this.navigationController.showContent(view);
				this.setHeader({
					title: m.get('name')
				}, getHeadersAction({
					addSave: true,
					addDownloadFolder: m.get('folder_id'),
					addPublish: m.get('folder_id'),
					addFolder: m.get('folder_id')
				}), HeaderTabsFolder(folder_id));
			}.bind(this))
			.fail(function() {
				// Folder not found !
				this.notFound();
				this.setHeader({
					title: 'Dossier introuvable'
				});
			}.bind(this));
	},

	actionNewFolder: function(parent_id) {

		var m = new(new Folders()).model({
			name: 'Intitulé par défaut',
			parent_folder_id: parent_id
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/media/folders/' + m.get('folder_id'));
			this.triggerSidebarMenu('refresh:folders');
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	actionDownloadFolder: function(folder_id) {
		// TODO
		console.log('actionDownloadFolder', folder_id);
	},

	/*
	 * File 
	 */

	showFile: function(id) {

		function buildBreadcrum(media, folder) {
			return [{
				href: '/media/folders/' + folder.get('folder_id') + '/files',
				title: folder.get('name')
			}, {
				title: media.get('name')
			}];
		}

		var m = new(new Files()).model({
			media_id: id
		});
		var folder;
		var collection = new Folders();
		collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		m.fetch().then(function() {
				folder = new(new Folders()).model({
					folder_id: m.get('folder_id')
				});
				return folder.fetch();
			})
			.done(function() {

				this.triggerSidebarMenu('change:folder', m.get('folder_id'));

				var view = new FileView({
					model: m,
					folder: folder,
					folders: collection
				});
				this.listenTo(folder, 'sync', function(model) {
					this.setBreadCrum(buildBreadcrum(m, model), true);
				});
				this.listenTo(m, 'change', function(model) {
					if (model.hasChanged('name')) {
						this.setBreadCrum(buildBreadcrum(model, folder), true);
					}
					if (model.hasChanged('folder_id')) {
						this.triggerSidebarMenu('change:folder', m.get('folder_id'));
					}
				}.bind(this));
				this.listenTo(m, 'destroy', function() {
					this.navigationController.showOverlay(300);
					this.navigationController.navigate('/media/folders/' + m.get('folder_id') + '/files');
				});
				this.navigationController.showContent(view);
				this.setHeader(
					buildBreadcrum(m, folder),
					getHeadersAction({
						addSave: true,
						addDownloadFile: m.get('media_id'),
						addPublish: m.get('folder_id')
					}));
			}.bind(this)).fail(function() {

				this.triggerSidebarMenu('change:folder', null);

				// File not found !
				this.notFound();
				this.setHeader({
					title: 'Fichier introuvable'
				});
			}.bind(this));
	},

	actionPublish: function(folder_id) {
		var collection = new Files();
		collection.folder_id = folder_id;
		var contentView = new PublishModalView({
			collection: collection
		});

		this.navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier'
			}
		});
	},

	actionDownloadFile: function(media_id) {
		// TODO
		console.log('actionDownloadFile', media_id);
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new MediaController(),
	appRoutes: {
		'media': 'showIndex',
		'media/folders/:id/files': 'showFiles',
		'media/folders/:id': 'showFolder',
		'media/files/:id': 'showFile'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
