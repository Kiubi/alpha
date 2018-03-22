var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var moment = require('moment');

var Controller = require('kiubi/controller.js');
var ControllerChannel = Backbone.Radio.channel('controller');

/* Models */
var Blog = require('./models/blog');
var Category = require('./models/category');
var Categories = require('./models/categories');
var Post = require('./models/post');
var Posts = require('./models/posts');
var Comments = require('./models/comments');
var Link = require('./models/link');
var Links = require('./models/links');
var Settings = require('./models/settings');
var Home = require('./models/home');

/* Views */
var PostsView = require('./views/posts');
var PostView = require('./views/post');
var HomeView = require('./views/home');
var SettingsView = require('./views/settings');
var LinksView = require('./views/links');
var CommentsView = require('./views/comments');
var CategoryView = require('./views/category');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	actions = actions.concat(
		[{
			title: 'Rédiger un billet',
			callback: 'actionNewPost'
		}, {
			title: 'Ajouter une catégorie',
			callback: 'actionNewCategory'
		}]
	);
	if (options.preview) {
		actions.push({
			title: 'Aperçu',
			callback: ['actionPreview', options.preview]
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

/* Tabs  */
function HeaderTabsPost(post_id, nb) {

	return [{
		title: 'Détail du billet',
		url: '/blog/posts/' + post_id
	}, {
		title: nb + ' ' + (nb > 1 ? 'commentaires' : 'commentaire'),
		url: '/blog/posts/' + post_id + '/comments'
	}];
}

function HeaderTabscategory(category_id, nb) {
	return [{
		title: 'Détail de la catégorie',
		url: '/blog/categories/' + category_id
	}, {
		title: nb + ' ' + (nb > 1 ? 'billets postés' : 'billet posté'),
		url: '/blog/categories/' + category_id + '/posts'
	}];
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'blog',

	behaviors: [ActiveLinksBehaviors],

	ui: {
		'btn-category-add': 'a[data-role="category-add"]'
	},

	events: {
		'click @ui.btn-category-add': function() {
			this.trigger('add:category');
		}
	},

	initialize: function(options) {

		this.categories = new Categories();
		this.home = new Home();
		this.overview = new Blog();
		this.is_loaded = false;

		this.listenTo(ControllerChannel, 'refresh:categories', this.onRefreshCategories);

		this.fetchAndRender();
	},

	fetchAndRender: function() {
		Backbone.$.when(
			this.categories.fetch(),
			this.home.fetch(),
			this.overview.fetch()
		).done(function() {
			this.is_loaded = true;
			this.render();
		}.bind(this)).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	templateContext: function() {
		return {
			is_loaded: this.is_loaded,
			categories: this.categories.toJSON(),
			home: this.home.toJSON(),
			overview: this.overview.toJSON()
		};
	},

	onRefreshCategories: function() {
		Backbone.$.when(
			this.categories.fetch(),
			this.home.fetch()
		).done(function() {
			this.render();
		}.bind(this));
	}

});

var BlogController = Controller.extend({

	sidebarMenuService: 'blog',
	sidebarMenu: SidebarMenuView,
	sidebarMenuEvents: {
		'add:category': 'actionNewCategory'
	},

	baseBreadcrum: [{
		title: 'Blog',
		href: '/blog'
	}],

	/*
	 * Posts
	 */

	showPosts: function(category_id) {

		var promise;
		var c = new Posts();
		var title = 'Tous les billets postés';
		var tabs = null;
		if (category_id > 0) {
			c.category_id = category_id;
			var categorie = new Category({
				category_id: category_id
			});
			promise = categorie.fetch().done(function() {
				title = categorie.get('name');
				tabs = HeaderTabscategory(category_id, categorie.get('posts_count'));
			});
		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		promise.done(function() {

			var view = new PostsView({
				collection: c,
				categories: new Categories()
			});

			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
					title: title
				},
				getHeadersAction(),
				tabs);

		}.bind(this)).fail(function() {
			// Categorie not found !
			this.notFound();
			this.setHeader({
				title: 'Catégorie introuvable'
			});
		}.bind(this));
	},

	showPost: function(id) {

		var m = new Post({
			post_id: id
		});

		m.fetch().done(function() {
			var categories = new Categories();
			categories.fetch();
			var view = new PostView({
				model: m,
				categories: categories,
				typesSource: m.getTypes()
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('title')) {
					this.setBreadCrum({
						title: model.get('title')
					}, true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/blog');
			});
			this.navigationController.showContent(view);
			this.setHeader({
					title: m.get('title')
				}, getHeadersAction({
					preview: m,
					addSave: true
				}),
				HeaderTabsPost(id, m.get('comments_count')));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Billet introuvable'
			});
		}.bind(this));
	},

	actionNewPost: function() {

		var that = this;
		var categories = new Categories();

		// Get first random categorie
		return categories.fetch({
			data: {
				limit: 1
			}
		}).then(function() {

			if (categories.length < 1) {
				that.navigationController.showErrorModal('Erreur de chargement des catégories du blog');
				return;
			}

			var m = new Post({
				title: 'Intitulé par défaut',
				slug: 'intitule-par-defaut',
				is_visible: false,
				has_comments_open: true,
				publication_date: moment().format('YYYY-MM-DD hh:mm:ss'),
				category_id: categories.at(0).get('category_id')
			});

			return m.save().done(function() {
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/blog/posts/' + m.get('post_id'));
			}).fail(function(xhr) {
				that.navigationController.showErrorModal(xhr);
			});
		});
	},

	/*
	 * Home
	 */

	showHome: function() {

		var m = new Home();
		m.fetch().done(function() {
			var view = new HomeView({
				collection: new Categories(),
				model: m
			});
			this.listenTo(m, 'change', function(model) {
				this.triggerSidebarMenu('refresh:categories');
			}.bind(this));
			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
				title: 'Accueil du blog'
			}, getHeadersAction({
				preview: m,
				addSave: true
			}));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Accueil du blog introuvable'
			});
		}.bind(this));
	},

	/*
	 * Settings
	 */

	showSettings: function() {

		var m = new Settings();
		m.fetch().done(function() {
			var view = new SettingsView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Paramètres du blog'
			}, getHeadersAction({
				addSave: true
			}));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	/*
	 * Links
	 */

	showLinks: function() {

		var view = new LinksView({
			collection: new Links()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Blogroll'
		});

	},

	/*
	 * Comments
	 */

	showComments: function(post_id) {

		var promise;

		var c = new Comments();
		var title = 'Tous les commentaires';
		var tabs = null;
		var actions = null;
		var param = {};
		if (post_id > 0) {
			param.post_id = post_id;

			var post = new Post({
				post_id: post_id
			});
			promise = post.fetch().done(function() {

				title = post.get('title');
				tabs = HeaderTabsPost(post_id, post.get('comments_count'));
				actions = getHeadersAction({
					preview: post
				});
			});

		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		promise.done(function() {
			var view = new CommentsView({
				collection: c,
				enableAddComment: (post_id > 0),
				childViewOptions: param
			});
			this.navigationController.showContent(view);
			view.start(param);
			this.setHeader({
					title: title
				},
				actions,
				tabs);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Billet introuvable'
			});
		}.bind(this));
	},

	/*
	 * Categories
	 */

	showCategory: function(id) {

		var m = new Category({
			category_id: id
		});
		m.fetch().done(function() {
			var view = new CategoryView({
				model: m
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
				}
				if (model.hasChanged('name') || model.hasChanged('is_visible')) {
					this.triggerSidebarMenu('refresh:categories');
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/blog/home');
				this.triggerSidebarMenu('refresh:categories');
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addSave: true
			}), HeaderTabscategory(id, m.get('posts_count')));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Catégorie introuvable'
			});
		}.bind(this));
	},

	actionNewCategory: function() {

		var m = new Category({
			name: 'Intitulé par défaut',
			slug: 'intitule-par-defaut',
			is_visible: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/blog/categories/' + m.get('category_id'));
			this.triggerSidebarMenu('refresh:categories');
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));

	},

	/*
	 * Others
	 */

	actionPreview: function(model) {
		window.open(model.previewLink);
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new BlogController(),
	appRoutes: {
		'blog': 'showPosts',
		'blog/home': 'showHome',
		'blog/settings': 'showSettings',
		'blog/links': 'showLinks',
		'blog/posts/:id': 'showPost',
		'blog/posts/:id/comments': 'showComments',
		'blog/comments': 'showComments',
		'blog/categories/:id': 'showCategory',
		'blog/categories/:id/posts': 'showPosts'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}

});
