var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Controller = require('kiubi/controller.js');

/* Models */
var Menus = require('./models/menus');
var Menu = require('./models/menu');
var Page = require('./models/page');
var Post = require('./models/post');
var Home = require('./models/home');

/* Views */
var IndexView = require('./views/index');
var MenuView = require('./views/menu');
var PageView = require('./views/page');
var PostView = require('./views/post');
var PageAddModalView = require('./views/modal.page.add');
var MenuTree = require('kiubi/views/ui/menuTree.js');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	if (options.addPost) {
		actions.push({
			title: 'Ajouter un billet',
			callback: ['actionNewPost', options.addPost] // page_id
		});
	}

	if (options.duplicatePost) {
		actions.push({
			title: 'Dupliquer le billet',
			callback: ['actionDuplicationPost', options.duplicatePost] // post_id
		});
	}

	if (options.addPage) {
		actions.push({
			title: 'Ajouter une page libre',
			callback: ['actionNewPage', options.addPage] // menu_id
		});
	}

	if (options.preview) {
		actions.push({
			title: 'Aperçu',
			callback: ['actionPreview', options.preview]
		});
	}

	if (actions.length <= 1) {
		actions.push({
			title: 'Enregistrer',
			callback: 'actionSave'
		});
	} else {
		actions.splice(1, 0, {
			title: 'Enregistrer',
			callback: 'actionSave'
		});
	}

	return actions;
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'cms',

	ui: {
		'btn-page-add': 'a[data-role="page-add"]',
		'btn-menu-add': 'a[data-role="menu-add"]'
	},

	events: {
		'click @ui.btn-page-add': 'addPage',
		'click @ui.btn-menu-add': 'addMenu',
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

	page_id: -1,

	addPage: function(event) {
		var $link = Backbone.$(event.currentTarget);

		this.trigger('add:page', $link.data('id'));
	},

	addMenu: function(event) {
		this.trigger('add:menu');
	},

	onChangePage: function(page_id) {
		if (this.page_id == page_id) return;

		this.page_id = page_id;
		this.render();
	},

	initialize: function(options) {
		this.collection = new Menus();

		this.fetchAndRender();

		var that = this;

		this.menuTree = new MenuTree({
			nodeInfo: function(model) {

				var extraClassname = '';

				if (!model.get('is_visible')) {
					extraClassname += ' pagetype-visibility-off';
				}

				switch (model.get('page_type')) {
					case 'lien_int':
						extraClassname += ' pagetype-internal-link';
						break;
					case 'lien_ext':
						extraClassname += ' pagetype-external-link';
						break;
					case 'separateur':
						extraClassname += ' pagetype-separator';
						break;
					case 'page':
						extraClassname += ' pagetype-page';
						break;
				}
				if (model.get('has_restrictions')) extraClassname += ' pagetype-extranet';

				return {
					url: model.get('is_home') ? '/cms' : '/cms/pages/' + model.get('page_id'),
					name: model.get('name'),
					is_active: model.get('page_id') == that.page_id,
					extraClassname: extraClassname
				};
			},
			rootFooter: function(node) {
				return '<li class="page-add">' +
					'<a href="#" data-role="page-add" ' +
					'data-id="' + node.menu_id + '">' +
					'<span class="md-icon"></span>Ajouter une page</a></li>';
			}
		});
	},

	fetchAndRender: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'pages'
			}
		}).done(function() {
			this.render();
		}.bind(this));
	},

	templateContext: function() {
		return {
			renderMenu: function(menu_id) {
				if (this.page_id == -1) return '';
				return this.menuTree.render(this.collection.getMenuTree(menu_id)).html;
			}.bind(this)
		};
	},

	onRefreshMenus: function() {
		this.fetchAndRender();
	}

});

var CMSController = Controller.extend({

	sidebarMenuService: 'cms',
	sidebarMenu: SidebarMenuView,
	sidebarMenuEvents: {
		'add:page': 'showPageAdd',
		'add:menu': 'actionNewMenu'
	},

	baseBreadcrum: [{
		title: 'Site Web',
		href: '/cms'
	}],

	/**
	 * Home
	 */

	showIndex: function() {

		var m = new Home();
		m.fetch().done(function() {

			this.triggerSidebarMenu('change:page', m.get('page_id'));

			var view = new IndexView({
				model: m
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
				}
				if (model.hasChanged('name') || model.hasChanged('is_visible')) {
					this.triggerSidebarMenu('refresh:menus');
				}
			}.bind(this));
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addPost: m.get('page_id'),
				addPage: m.get('menu_id')
			}));
			view.start();
		}.bind(this)).fail(function() {

			this.triggerSidebarMenu('change:page', null);

			this.notFound();
			this.setHeader({
				title: 'Page introuvable'
			});
		}.bind(this));
	},

	/**
	 * Menus
	 */

	showMenu: function(id) {

		var m = new Menu({
			menu_id: id
		});

		this.triggerSidebarMenu('change:page', null);

		m.fetch().done(function() {
			var view = new MenuView({
				model: m
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
					this.triggerSidebarMenu('refresh:menus');
				}
			}.bind(this));
			this.listenTo(m, 'destroy', this.actionDeletedMenu);
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				addPage: m.get('menu_id')
			}));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Menu introuvable'
			});
		}.bind(this));
	},

	actionDeletedMenu: function() {
		this.navigationController.showOverlay(300);
		this.navigationController.navigate('/cms');
		this.triggerSidebarMenu('refresh:menus');
	},

	actionNewMenu: function() {

		var m = new Menu({
			name: 'Intitulé par défaut'
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/cms/menus/' + m.get('menu_id'));
			this.triggerSidebarMenu('refresh:menus');
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	/**
	 * Pages
	 */

	showPage: function(id) {

		var m = new Page({
			page_id: id
		});

		this.triggerSidebarMenu('change:page', id);

		m.fetch().done(function() {
			var view = new PageView({
				model: m,
				menus: new Menus()
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
				}
				if (
					model.hasChanged('name') || model.hasChanged('is_visible') || model.hasChanged('page_type') ||
					model.hasChanged('menu_id') || model.hasChanged('page_parent_id') || model.hasChanged('after_id') ||
					model.hasChanged('before_id')
				) {
					this.triggerSidebarMenu('refresh:menus');
				}
			}.bind(this));
			this.listenTo(m, 'destroy', this.actionDeletedMenu); // same action
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addPost: m.get('page_type') == 'page' ? m.get('page_id') : false,
				addPage: m.get('menu_id')
			}));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Page introuvable'
			});
		}.bind(this));
	},

	actionNewPage: function(menu_id) {

		var that = this;
		var menu = new Menu({
			menu_id: menu_id
		});

		return menu.fetch().then(function() {

			var m = new Page({
				title: 'Intitulé par défaut',
				slug: 'intitule-par-defaut',
				is_visible: false,
				page_type: 'page',
				menu_id: menu.get('menu_id')
			});

			return m.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/pages/' + m.get('page_id'));
				that.triggerSidebarMenu('refresh:menus');
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},

	actionNewInternalLink: function(menu_id) {
		var that = this;
		var menu = new Menu({
			menu_id: menu_id
		});

		return menu.fetch().then(function() {

			var m = new Page({
				is_visible: false,
				page_type: 'internal_link',
				target_type: 'cms',
				target_page: 'index',
				menu_id: menu.get('menu_id')
			});

			return m.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/pages/' + m.get('page_id'));
				that.triggerSidebarMenu('refresh:menus');
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},

	actionNewExternalLink: function(menu_id) {
		var that = this;
		var menu = new Menu({
			menu_id: menu_id
		});

		return menu.fetch().then(function() {
			var m = new Page({
				is_visible: false,
				page_type: 'external_link',
				url: 'http://www.kiubi.com/',
				url_target: '_blank',
				menu_id: menu.get('menu_id')
			});

			return m.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/pages/' + m.get('page_id'));
				that.triggerSidebarMenu('refresh:menus');
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},

	actionNewSeparator: function(menu_id) {
		var that = this;
		var menu = new Menu({
			menu_id: menu_id
		});

		return menu.fetch().then(function() {

			var m = new Page({
				is_visible: false,
				page_type: 'separator',
				menu_id: menu.get('menu_id')
			});

			return m.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/pages/' + m.get('page_id'));
				that.triggerSidebarMenu('refresh:menus');
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},


	/**
	 * Posts
	 */

	showPost: function(id) {

		function buildBreadcrum(post, page) {
			return [{
				href: page.get('is_home') ? '/cms' : '/cms/pages/' + page.get('page_id'),
				title: page.get('name')
			}, {
				title: post.getLabel()
			}];
		}

		var m = new Post({
			post_id: id
		});
		var page;
		m.fetch({
			data: {
				extra_fields: 'texts'
			}
		}).
		then(function() {
			page = new Page({
				page_id: m.get('page_id')
			});
			return page.fetch();
		}).
		done(function() {

			this.triggerSidebarMenu('change:page', m.get('page_id'));

			var view = new PostView({
				model: m,
				page: page,
				menus: new Menus(),
				typesSource: m.getTypes()
			});
			this.listenTo(page, 'sync', function(model) {
				this.setBreadCrum(buildBreadcrum(m, model), true);
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('title') || model.hasChanged('subtitle')) {
					this.setBreadCrum(buildBreadcrum(model, page), true);
				}
				if (model.hasChanged('page_id')) {
					this.triggerSidebarMenu('change:page', model.get('page_id'));
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate(page.get('is_home') ? '/cms' : '/cms/pages/' + page.get('page_id'));
				this.triggerSidebarMenu('refresh:menus');
			});
			this.navigationController.showContent(view);
			this.setHeader(
				buildBreadcrum(m, page),
				getHeadersAction({
					preview: page,
					addPost: m.get('page_id'),
					duplicatePost: id
				}));
		}.bind(this)).fail(function() {

			this.triggerSidebarMenu('change:page', null);

			this.notFound();
			this.setHeader({
				title: 'Billet introuvable'
			});
		}.bind(this));
	},

	actionNewPost: function(page_id) {
		var that = this;

		var post = new Post({
			title: 'Intitulé par défaut',
			is_visible: false,
			page_id: page_id
		});

		return post.getTypes().then(function(types) {
			if (types.length == 0) {
				that.navigationController.showErrorModal('Chargement des types de billets échoué');
				return;
			}

			post.set('type', types[0].type);

			return post.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/posts/' + post.get('post_id'));
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},

	actionDuplicationPost: function(post_id) {

		var that = this;

		var m = new Post({
			post_id: post_id
		});

		m.duplicate()
			.done(function(copy) {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/posts/' + copy.get('post_id'));
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
	},

	/*
	 * Others
	 */

	actionPreview: function(model) {
		window.open(model.previewLink);
	},

	actionSave: function() {
		// Proxy to content View method onSave
		var contentView = this.navigationController.getContent();
		if (!contentView || !contentView.onSave) return;

		var container = {};
		contentView.triggerMethod('simpleForm:save', container);
		if (container.promise) return container.promise;
	},

	/*
	 * Modal
	 */

	showPageAdd: function(menu_id) {
		var contentView = new PageAddModalView({
			menu_id: menu_id
		});

		this.listenTo(contentView, 'select:extLink', this.actionNewExternalLink);
		this.listenTo(contentView, 'select:intLink', this.actionNewInternalLink);
		this.listenTo(contentView, 'select:page', this.actionNewPage);
		this.listenTo(contentView, 'select:separator', this.actionNewSeparator);

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter une page',
			modalClass: 'modal-pagetype-add'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CMSController(),
	appRoutes: {
		'cms': 'showIndex',
		'cms/menus/:id': 'showMenu',
		'cms/pages/:id': 'showPage',
		'cms/posts/:id': 'showPost'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
