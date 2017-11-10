var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Controller = require('kiubi/controller');

/* Models */
var Folder = require('./models/folder');
var Folders = require('./models/folders');
var File = require('./models/file');
var Files = require('./models/files');

/* Views */
var IndexView = require('./views/index');
var FilesView = require('./views/files');
var FolderView = require('./views/folder');
var FileView = require('./views/file');

function HeaderTabsFolder(folder_id) {
	return [{
		title: 'Contenu du dossier',
		url: '/media/folders/' + folder_id + '/files'
	}, {
		title: 'Paramètres du dossier',
		url: '/media/folders/' + folder_id
	}];
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'media',
	behaviors: [ActiveLinksBehaviors],

	events: {
		'show.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-more').addClass('menu-expand-less');
		},
		'hide.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-less').addClass('menu-expand-more');
		}
	},

	initialize: function(options) {
		this.collection = new Folders();

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

	renderMenu: function(node) {

		var html = '';
		var closing = '';

		if (node.model) {
			// LEAF
			html = '<div class="menu-tree"><ul class="nav nav-sidebar collapse" ' +
				'id="menutree' + node.model.get('folder_id') + '">';
			closing = '</ul></div>';
		} else {
			// ROOT
			html = '<div class="menu-tree"><ul class="nav nav-sidebar">';
			closing = '</ul></div>';
		}

		_.each(node.childs, function(pageNode) {

			var className = '';
			var aria = '';
			if (pageNode.childs.length > 0) {
				className += 'menu-expand-more';
				aria = 'data-toggle="collapse" ' +
					'href="#menutree' + pageNode.model.get('folder_id') + '" ' +
					'aria-expanded="false" ' +
					'aria-controls="menutree' + pageNode.model.get('folder_id') + '"';
			}

			if (pageNode.model.get('has_restrictions')) className +=
				' pagetype-extranet';

			html += '<li class="' + className + '">' +
				'<span class="menu-expand" ' + aria + '></span>' +
				'<a href="/media/folders/' + pageNode.model.get('folder_id') +
				'/files" ' +
				'title="' + _.escape(pageNode.model.get('name')) + '">' +
				'<span class="md-icon"></span>' +
				pageNode.model.get('name') +
				'</a></li>';
			if (pageNode.childs.length > 0) {
				html += this.renderMenu(pageNode);
			}
		}.bind(this));

		return html + closing;
	},

	templateContext: function() {
		return {
			renderMenu: function() {
				return this.renderMenu(this.collection.getMenuTree());
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

	showIndex: function() {
		console.log('MediaController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les médias'
		});
	},

	showFiles: function(folder_id) {

		var m = new Folder({
			folder_id: folder_id
		});
		var collection = new Files();
		collection.folder_id = folder_id;
		m.fetch().done(function() {
				this.navigationController.showContent(new FilesView({
					folder: m,
					collection: collection
				}));
				this.setHeader({
					title: m.get('name')
				}, [], HeaderTabsFolder(folder_id));
			}.bind(this))
			.fail(function() {
				// Folder not found !
				this.notFound();
				this.setHeader({
					title: 'Dossier introuvable'
				});
			}.bind(this));
	},

	showFolder: function(folder_id) {
		var m = new Folder({
			folder_id: folder_id
		});
		var collection = new Folders();
		collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		m.fetch().done(function() {
				this.navigationController.showContent(new FolderView({
					model: m,
					folders: collection
				}));
				this.setHeader({
					title: m.get('name')
				}, [], HeaderTabsFolder(folder_id));
			}.bind(this))
			.fail(function() {
				// Folder not found !
				this.notFound();
				this.setHeader({
					title: 'Dossier introuvable'
				});
			}.bind(this));
	},

	showFile: function(id) {

		var m = new File({
			media_id: id
		});
		var collection = new Folders();
		collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		});

		m.fetch().done(function() {
			this.navigationController.showContent(new FileView({
				model: m,
				folders: collection
			}));
			this.setHeader({
				title: m.get('name')
			});
		}.bind(this)).fail(function() {
			// File not found !
			this.notFound();
			this.setHeader({
				title: 'Fichier introuvable'
			});
		}.bind(this));


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
