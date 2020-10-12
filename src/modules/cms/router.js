var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var Forms = require('kiubi/utils/forms.js');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

/* Models */
var Menus = require('./models/menus');
var Page = require('./models/page');
var Posts = require('./models/posts');
var Home = require('./models/home');
var Symbols = require('./models/symbols');
var Contents = require('./models/contents');
var Collection = require('./models/collection');
var Builder = require('../appearance/models/builder');
var Layout = require('../appearance/models/layout');

/* Views */
var IndexView = require('./views/index');
var MenuView = require('./views/menu');
var PageView = require('./views/page');
var PostView = require('./views/post');
var PostsView = require('./views/posts');
var ComponentView = require('./views/component');
var SymbolView = require('./views/symbol');
var PageAddModalView = require('./views/modal.page.add');
var MenuTree = require('kiubi/core/views/ui/menuTree.js');
var ContentAddModalView = require('./views/modal.content.add');
var LayoutView = require('../appearance/views/layout');
var SidebarMenuLayoutView = require('../appearance/views/layout.sidebar');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	if (options.addPageContent) {
		actions.push({
			title: 'Ajouter un contenu',
			icon: 'md-add-outline',
			isPrimary: true,
			callback: ['showContentAdd', {
				container_id: options.addPageContent,
				container_type: 'page'
			}]
		});
	}

	if (options.addSymbolContent) {
		actions.push({
			title: 'Ajouter un contenu',
			icon: 'md-add-outline',
			isPrimary: true,
			callback: ['showContentAdd', {
				container_id: options.addSymbolContent,
				container_type: 'symbol'
			}]
		});
	}

	if (options.duplicateContent) {
		actions.push({
			title: 'Dupliquer',
			icon: 'md-duplicate',
			isOptional: true,
			callback: ['actionDuplicationContent', options.duplicateContent] // content_id
		});
	}

	if (options.duplicatePage) {
		actions.push({
			title: 'Dupliquer',
			icon: 'md-duplicate',
			isOptional: true,
			callback: ['actionDuplicationPage', options.duplicatePage] // page_id
		});
	}

	if (options.duplicateSymbol) {
		actions.push({
			title: 'Dupliquer',
			icon: 'md-duplicate',
			isOptional: true,
			callback: ['actionDuplicationSymbol', options.duplicateSymbol] // symbol_id
		});
	}

	if (options.addPageInMenu || options.addPage) {
		var data = {};
		if (options.addPageInMenu) data.menu_id = options.addPageInMenu;
		if (options.addPage) data.page_parent_id = options.addPage;
		actions.push({
			title: 'Ajouter une page',
			icon: 'md-add-outline',
			callback: ['actionNewPage', data]
		});
	}

	if (options.preview) {
		actions.push({
			title: 'Aperçu',
			icon: 'md-launch',
			isOptional: true,
			callback: ['actionPreview', options.preview]
		});
	}

	var saveAction = {
		title: 'Enregistrer',
		callback: 'actionSave',
		activateOnEvent: options.forceSave ? null : 'modified:content',
		bubbleOnEvent: options.forceSave ? null : 'modified:content'
	};

	if (actions.length <= 1) {
		actions.push(saveAction);
	} else {
		actions.splice(1, 0, saveAction);
	}

	return actions;
}


/* Tabs  */
function HeaderTabsSymbol(symbol_id) {

	var actions = [{
		title: 'Symbole',
		url: '/cms/symbols/' + symbol_id,
		icon: 'md-symbole-detail'
	}];

	var Session = Backbone.Radio.channel('app').request('ctx:session');
	if (Session.hasScope('site:layout')) {
		actions.push({
			title: 'Widgets',
			url: '/cms/symbols/' + symbol_id + '/layout',
			icon: 'md-symbole-widgets'
		});
	}

	return actions;
}

function getPostNavigation(model) {

	if (!model.nextContent && !model.previousContent) return null;

	return {
		next: model.nextContent ? '/cms/contents/' + model.nextContent : false,
		previous: model.previousContent ? '/cms/contents/' + model.previousContent : false
	};

}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

var SidebarMenuTreeView = Marionette.View.extend({
	template: require('./templates/sidebarMenu/menus.html'),
	service: 'cms',

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

	page_id: -1,

	initialize: function(options) {
		this.page_id = -1;
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
				return '<a href="#" data-role="page-add" ' +
					'data-id="' + node.menu_id + '" class="page-add md-icon md-add-page" ' +
					'title="Ajouter une page"></a>';
			}
		});
	},

	changePage: function(page_id) {
		if (this.page_id == page_id) return;

		this.page_id = page_id;
		this.render();
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
	}

});

var SidebarMenuSymbolsView = Marionette.View.extend({

	template: require('./templates/sidebarMenu/symbols.html'),

	symbol_id: null,

	initialize: function(options) {

		this.symbol_id = null;

		this.collection = new Symbols();
		this.fetchAndRender();

	},

	templateContext: function() {

		return {
			'symbol_id': this.symbol_id,
			'symbols': this.collection.toJSON(),
			'limit': this.collection.getQuota(),
			'usage': this.collection.length
		};

	},

	fetchAndRender: function() {
		this.collection.fetch().done(function() {
			this.render();
		}.bind(this));
	},

	changeSymbol: function(symbol_id) {
		if (this.symbol_id == symbol_id) return;

		this.symbol_id = symbol_id;
		this.render();
	}

});

var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'cms',

	ui: {
		'btn-page-add': 'a[data-role="page-add"]'
	},

	events: {
		'click @ui.btn-page-add': 'addPage'
	},

	regions: {
		menus: {
			el: "div[data-role='menus']",
			replaceElement: true
		},
		symbols: {
			el: "div[data-role='symbols']",
			replaceElement: true
		}
	},

	onRender: function() {
		this.showChildView('menus', new SidebarMenuTreeView());

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (Session.hasFeature('component')) {
			this.showChildView('symbols', new SidebarMenuSymbolsView());
		}

	},

	onRefreshMenus: function() {
		var view = this.getChildView('menus');
		if (view) view.fetchAndRender();
	},

	onChangePage: function(page_id) {
		var view = this.getChildView('menus');
		if (view) view.changePage(page_id);

		var view = this.getChildView('symbols');
		if (view) view.changeSymbol(null);
	},

	onRefreshSymbols: function() {
		var view = this.getChildView('symbols');
		if (view) view.fetchAndRender();
	},

	onChangeSymbol: function(symbol_id) {
		var view = this.getChildView('menus');
		if (view) view.changePage(null);

		var view = this.getChildView('symbols');
		if (view) view.changeSymbol(symbol_id);
	},

	addPage: function(event) {

		var $link = Backbone.$(event.currentTarget);

		this.trigger('add:page', $link.data('id'));
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
		m.fetch({
			data: {
				extra_fields: 'defaults,zones'
			}
		}).done(function() {
			this.addContext('page_id', m.get('page_id'));
			this.triggerSidebarMenu('change:page', m.get('page_id'));
			var Session = Backbone.Radio.channel('app').request('ctx:session');

			var view = new IndexView({
				model: m,
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout'),
				enableZones: Session.hasFeature('component')
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
				addPageContent: m.get('page_id')
				//addPageInMenu: m.get('menu_id')
			}));
			view.start();
		}.bind(this)).fail(function() {
			this.triggerSidebarMenu('change:page', null);
			this.failHandler('Page introuvable')();
		}.bind(this));
	},

	/**
	 * Menus
	 */

	showMenu: function(id) {

		var c = new Menus();
		var m = new c.model({
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
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms');
				this.triggerSidebarMenu('refresh:menus');
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				addPageInMenu: m.get('menu_id')
			}));
		}.bind(this)).fail(this.failHandler('Menu introuvable'));
	},

	actionNewMenu: function() {

		var c = new Menus();
		var m = new c.model({
			name: 'Intitulé par défaut'
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/cms/menus/' + m.get('menu_id'));
			this.triggerSidebarMenu('refresh:menus');
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));
	},

	/**
	 * Pages
	 */

	showPage: function(id) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		var m = new Page({
			page_id: id
		});

		this.triggerSidebarMenu('change:page', id);

		m.fetch({
			data: {
				extra_fields: 'defaults' + (Session.hasFeature('component') ? ',zones' : '')
			}
		}).done(function() {
			this.addContext('page_id', m.get('page_id'));

			var view = new PageView({
				model: m,
				menus: new Menus(),
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout'),
				enableExtranet: Session.hasFeature('extranet'),
				enableZones: Session.hasFeature('component')
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
					model.hasChanged('before_id') || model.hasChanged('has_restrictions')
				) {
					this.triggerSidebarMenu('refresh:menus');
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms');
				this.triggerSidebarMenu('refresh:menus');
			});
			this.listenTo(m, 'sync', function(model) {
				// header actions depends on page type
				this.setHeaderActions(getHeadersAction({
					preview: model.get('page_type') == 'page' ? model : false,
					addPageContent: model.get('page_type') == 'page' ? model.get('page_id') : false,
					addPage: model.get('page_parent_id') > 0 ? model.get('page_parent_id') : false,
					addPageInMenu: model.get('page_parent_id') == 0 ? model.get('menu_id') : false,
					duplicatePage: model.get('page_type') == 'page' ? model.get('page_id') : false
				}), true);
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m.get('page_type') == 'page' ? m : false,
				addPageContent: m.get('page_type') == 'page' ? m.get('page_id') : false,
				addPage: m.get('page_parent_id') > 0 ? m.get('page_parent_id') : false,
				addPageInMenu: m.get('page_parent_id') == 0 ? m.get('menu_id') : false,
				duplicatePage: m.get('page_type') == 'page' ? m.get('page_id') : false
			}));
		}.bind(this)).fail(this.failHandler('Page introuvable'));
	},

	actionNewPage: function(position) {
		var m = new Page({
			name: 'Intitulé par défaut',
			slug: Forms.tmpSlug(),
			is_visible: false,
			page_type: 'page' //,
			//menu_id: menu.get('menu_id')
		});

		var done = function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/cms/pages/' + m.get('page_id'));
			this.triggerSidebarMenu('refresh:menus');
		}.bind(this);

		var fail = function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this);

		if (position.menu_id) {
			var c = new Menus();
			var menu = new c.model({
				menu_id: position.menu_id
			});

			return menu.fetch().then(function() {
				m.set('menu_id', menu.get('menu_id'));
				return m.save().done(done).fail(fail);
			}, fail);
		}

		var parent = new Page({
			page_id: position.page_parent_id
		});

		return parent.fetch().then(function() {
			m.set('page_parent_id', parent.get('page_id'));
			return m.save().done(done).fail(fail);
		}, fail);

	},

	actionNewInternalLink: function(position) {
		var that = this;
		var c = new Menus();
		var menu = new c.model({
			menu_id: position.menu_id
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
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
		}, function(error) {
			that.navigationController.showErrorModal(error);
		});
	},

	actionNewExternalLink: function(position) {
		var that = this;
		var c = new Menus();
		var menu = new c.model({
			menu_id: position.menu_id
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
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
		}, function(error) {
			that.navigationController.showErrorModal(error);
		});
	},

	actionNewSeparator: function(position) {
		var that = this;
		var c = new Menus();
		var menu = new c.model({
			menu_id: position.menu_id
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
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
		}, function(error) {
			that.navigationController.showErrorModal(error);
		});
	},

	actionDuplicationPage: function(page_id) {

		var that = this;
		var m = new Page({
			page_id: page_id
		});

		m.duplicate()
			.done(function(copy) {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/pages/' + copy.get('page_id'));
				that.triggerSidebarMenu('refresh:menus');
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
	},

	/**
	 * Posts
	 */


	showContent: function(id) {

		var container;

		var m = new(new Contents()).model({
			content_id: id
		});
		m.fetch({
			data: {
				extra_fields: 'texts,navigation'
			}
		}).then(function() {
			if (m.get('container_type') == 'page') {
				container = new Page({
					page_id: m.get('container_id')
				});
				this.addContext('page_id', m.get('container_id'));
				this.triggerSidebarMenu('change:page', m.get('container_id'));
			} else {
				container = new(new Symbols()).model({
					symbol_id: m.get('container_id')
				});
				this.addContext('page_id', null);
				this.triggerSidebarMenu('change:symbol', m.get('container_id'));
			}
			return container.fetch();
		}.bind(this)).done(function() {

			if (m.get('content') == 'post') {
				this.showPost(id, m, container);
			} else if (m.get('content') == 'component') {
				this.showComponent(id, m, container);
			} else {
				this.triggerSidebarMenu('change:page', null);
				this.failHandler('Contenu introuvable')();
			}
		}.bind(this)).fail(function() {
			this.triggerSidebarMenu('change:page', null);
			this.failHandler('Contenu introuvable')();
		}.bind(this));

	},

	showPost: function(id, content, container) {

		function buildBreadcrum(post, container) {
			return [{
				href: container.getBackURL(),
				title: container.getTitle()
			}, {
				title: post.getLabel()
			}];
		}

		var post = content.getContentModel();

		var view = new PostView({
			model: post,
			content: content,
			container: container,
			menus: content.get('container_type') == 'page' ? new Menus() : null,
			typesSource: post.getTypes()
		});
		this.listenTo(container, 'sync', function(model) {
			this.setBreadCrum(buildBreadcrum(post, model), true);
		});
		this.listenTo(post, 'change', function(model) {
			if (model.hasChanged('title') || model.hasChanged('subtitle')) {
				this.setBreadCrum(buildBreadcrum(model, container), true);
			}

		}.bind(this));
		this.listenTo(content, 'change', function(model) {
			if (model.hasChanged('container_id')) {
				this.addContext('page_id', model.get('container_id'));
				this.triggerSidebarMenu('change:page', model.get('container_id'));
			}
		}.bind(this));
		this.listenTo(content, 'destroy', function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate(container.getBackURL());
		});
		this.navigationController.showContent(view);
		this.setHeader(
			buildBreadcrum(post, container),
			getHeadersAction({
				preview: content.get('container_type') == 'page' ? container : false,
				addPageContent: content.get('container_type') == 'page' ? content.get('container_id') : null,
				addSymbolContent: content.get('container_type') == 'symbol' ? content.get('container_id') : null,
				duplicateContent: id
			}), null, getPostNavigation(content));
	},

	actionDuplicationContent: function(content_id) {
		var that = this;
		var m = new(new Contents()).model({
			content_id: content_id
		});
		m.duplicate()
			.done(function(copy) {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/cms/contents/' + copy.get('content_id'));
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
	},

	showComponent: function(id, content, container) {

		function buildBreadcrum(component, container) {
			return [{
				href: container.getBackURL(),
				title: container.getTitle()
			}, {
				title: component.getLabel()
			}];
		}

		var component = content.getContentModel();
		component.getTypes({
				extra_fields: 'fields,collection',
				filter: component.get('type')
			}).done(function(types) {

				if (types.length === 0) {
					this.notFound('Le type du composant "' + component.get('type') + '" est introuvable');
					this.setBreadCrum(buildBreadcrum(component, container), true);
					return;
				}

				if (content.get('container_type') == 'page') {
					this.addContext('page_id', content.get('container_id'));
					this.triggerSidebarMenu('change:page', content.get('container_id'));
				} else {
					this.addContext('page_id', null);
					this.triggerSidebarMenu('change:symbol', content.get('container_id'));
				}

				var collection = new Collection();
				collection.content_id = id;

				this.listenTo(container, 'sync', function(model) {
					this.setBreadCrum(buildBreadcrum(component, model), true);
				});
				this.listenTo(component, 'change', function(model) {
					if (model.hasChanged('fields')) {
						this.setBreadCrum(buildBreadcrum(component, container), true);
					}
				}.bind(this));
				this.listenTo(content, 'change', function(model) {
					if (model.hasChanged('container_id')) {
						this.addContext('page_id', model.get('container_id'));
						this.triggerSidebarMenu('change:page', model.get('container_id'));
					}
				}.bind(this));
				this.listenTo(content, 'destroy', function() {
					this.navigationController.showOverlay(300);
					this.navigationController.navigate(container.getBackURL());
					this.triggerSidebarMenu('refresh:menus');
				});

				this.navigationController.showContent(new ComponentView({
					model: component,
					content: content,
					container: container,
					collection: collection,
					type: types.length ? types[0] : null,
					menus: content.get('container_type') == 'page' ? new Menus() : null
				}));
				this.setHeader(
					buildBreadcrum(component, container),
					getHeadersAction({
						preview: content.get('container_type') == 'page' ? container : false,
						addPageContent: content.get('container_type') == 'page' ? content.get('container_id') : null,
						addSymbolContent: content.get('container_type') == 'symbol' ? content.get('container_id') : null,
						duplicateContent: id
					}), null, getPostNavigation(content));
			}.bind(this))
			.fail(function(error) {
				this.navigationController.showErrorModal(error);
			}.bind(this));

	},

	/*
	 * Symbols
	 */

	showSymbol: function(id) {

		var m = new(new Symbols()).model({
			symbol_id: id
		});

		m.fetch({
			data: {
				extra_fields: 'zones'
			}
		}).done(function() {
			this.triggerSidebarMenu('change:symbol', id);

			this.setHeader({
				title: m.get('params').title
			}, getHeadersAction({
				addSymbolContent: id,
				duplicateSymbol: id
			}), HeaderTabsSymbol(id));

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('params')) {
					this.setBreadCrum({
						title: m.get('params').title
					});
					this.triggerSidebarMenu('refresh:symbols');
				}
			}.bind(this));

			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms');
				this.triggerSidebarMenu('refresh:symbols');
			});

			var contents = new Contents();
			contents.symbol_id = id;
			var view = new SymbolView({
				model: m,
				modelsSource: m.getModels({
					extra_fields: 'fields,zones'
				}),
				contents: contents
			});

			this.navigationController.showContent(view);

			view.start();

		}.bind(this)).fail(function() {
			this.triggerSidebarMenu('change:page', null);
			this.failHandler('Symbole introuvable')();
		}.bind(this));

	},

	showSymbolLayout: function(id) {
		var symbol = new(new Symbols()).model({
			symbol_id: id
		});

		var builder;

		symbol.fetch().then(function() {
			builder = new Builder({
				layout_id: symbol.get('layout_id'),
				page: 'symbol'
			});
			return builder.save();
		}).done(function() {
			this.triggerSidebarMenu('change:symbol', id);

			this.setHeader({
				title: symbol.get('params').title
			}, getHeadersAction({
				forceSave: true,
				duplicateSymbol: id
			}), HeaderTabsSymbol(id));

			var view = new LayoutView({
				model: builder,
				layout_id: symbol.get('layout_id')
			});

			this.navigationController.showContent(view);

		}.bind(this)).fail(this.failHandler('Mise en page introuvable'));
	},

	actionNewSymbol: function() {

		var m = new(new Symbols()).model({
			title: 'Intitulé par défaut'
		});

		return m.save()
			.done(function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms/symbols/' + m.get('symbol_id'));
				this.triggerSidebarMenu('refresh:symbols');
			}.bind(this))
			.fail(function(xhr) {
				this.navigationController.showErrorModal(xhr);
			}.bind(this));
	},

	actionDuplicationSymbol: function(symbol_id) {

		var that = this;
		var m = new(new Symbols()).model({
			symbol_id: symbol_id
		});

		m.duplicate().done(function(copy) {
			that.navigationController.showOverlay(300);
			that.navigationController.navigate('/cms/symbols/' + copy.get('symbol_id'));
			that.triggerSidebarMenu('refresh:symbols');
		}).fail(function(error) {
			that.navigationController.showErrorModal(error);
		});
	},

	/*
	 * Others
	 */

	actionPreview: function(model) {
		window.open(model.previewLink);
	},

	/*
	 * Modal
	 */

	showPageAdd: function(menu_id) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var contentView = new PageAddModalView({
			menu_id: menu_id,
			enableSymbol: Session.hasFeature('component')
		});

		this.listenTo(contentView, 'select:extLink', this.actionNewExternalLink);
		this.listenTo(contentView, 'select:intLink', this.actionNewInternalLink);
		this.listenTo(contentView, 'select:page', this.actionNewPage);
		this.listenTo(contentView, 'select:separator', this.actionNewSeparator);
		this.listenTo(contentView, 'select:menu', this.actionNewMenu);
		this.listenTo(contentView, 'select:symbol', this.actionNewSymbol);

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter un élément',
			modalClass: 'modal-pagetype-add'
		});
	},

	showContentAdd: function(options) {
		options = options || {};

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var contentView = new ContentAddModalView({
			container_type: options.container_type,
			enableComponent: Session.hasFeature('component')
		});

		var fail = function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this);

		var content = new(new Contents()).model({
			is_visible: false,
			container_id: options.container_id,
			container_type: options.container_type
		});

		this.listenTo(contentView, 'select:post', function(selected) {
			content.set({
				content: 'post',
				type: selected.type
			});
			content.save().done(function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms/contents/' + content.get('content_id'));
			}.bind(this)).fail(fail);

		});
		this.listenTo(contentView, 'select:component', function(selected) {
			content.set({
				content: 'component',
				type: selected.type
			});
			content.save().done(function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/cms/contents/' + content.get('content_id'));
			}.bind(this)).fail(fail);

		});
		this.listenTo(contentView, 'select:symbol', function(selected) {
			content.set({
				content: 'symbol',
				symbol_id: selected.symbol_id,
				is_visible: true
			});
			content.save().done(function() {
				this.navigationController.hideModal();
				var path = '/cms/' + content.get('container_type') + 's/' + content.get('container_id');
				if (this.navigationController.getPath() === path) {
					this.navigationController.triggerContent('add:symbol');
				} else {
					this.navigationController.navigate(path);
				}
			}.bind(this)).fail(fail);
		});

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter un contenu',
			modalDialogClass: 'modal-sm',
			modalBodyClass: 'p-0'
		});
	},

	showPosts: function(queryString) {

		var qs = this.parseQueryString(queryString, {
			'term': null
		});

		this.triggerSidebarMenu('change:page', null);

		var view = new PostsView({
			collection: new Posts(),
			filters: qs
		});

		this.navigationController.showContent(view);

		view.start();

		this.setHeader({
			title: 'Recherche'
		});
	}

});

module.exports = Router.extend({
	controller: new CMSController(),
	appRoutes: {
		'cms': 'showIndex',
		'cms/menus/:id': 'showMenu',
		'cms/pages/:id': 'showPage',
		'cms/contents/:id': 'showContent',
		'cms/posts': 'showPosts',
		'cms/symbols/:id': 'showSymbol',
		'cms/symbols/:id/layout': 'showSymbolLayout'
	},

	onRoute: function(name) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:cms')) {
			this.controller.navigationController.navigate('/');
			return false;
		}

		// Load an other sidebar for showLayout
		this.controller.sidebarMenuService = 'cms';
		this.controller.sidebarMenu = SidebarMenuView;
		switch (name) {
			case 'showSymbol':
				if (!Session.hasFeature('component')) {
					this.controller.navigationController.navigate('/');
					return false;
				}
				break;
			case 'showSymbolLayout':
				if (!Session.hasScope('site:layout') || !Session.hasFeature('component')) {
					this.controller.navigationController.navigate('/');
					return false;
				}
				this.controller.sidebarMenuService = 'layout';
				this.controller.sidebarMenu = SidebarMenuLayoutView;
				break;
		}

		this.controller.showSidebarMenu();
	}
});
