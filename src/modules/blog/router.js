var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var moment = require('moment');
var Forms = require('kiubi/utils/forms.js');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');
var ControllerChannel = Backbone.Radio.channel('controller');

/* Models */
var Blog = require('./models/blog');

var Categories = require('./models/categories');
var Posts = require('./models/posts');
var Comments = require('./models/comments');
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
			callback: 'actionNewPost',
			icon: 'md-add-outline'

		}, {
			title: 'Ajouter une catégorie',
			callback: 'actionNewCategory',
			icon: 'md-add-outline'
		}]
	);
	if (options.preview) {
		actions.push({
			title: 'Aperçu',
			icon: 'md-launch',
			isOptional: true,
			callback: ['actionPreview', options.preview]
		});
	}

	if (options.addSave) {

		var saveAction = {
			title: 'Enregistrer',
			callback: 'actionSave',
			icon: 'md-save',
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
		title: 'Billet',
		url: '/blog/posts/' + post_id,
		icon: 'md-blog-detail'
	}, {
		title: nb + ' ' + (nb > 1 ? 'Commentaires' : 'Commentaire'),
		url: '/blog/posts/' + post_id + '/comments',
		icon: 'md-blog-comment'
	}];
}

function HeaderTabscategory(category_id, nb) {
	return [{
		title: 'Catégorie',
		url: '/blog/categories/' + category_id,
		icon: 'md-blog-categ'
	}, {
		title: nb + ' ' + (nb > 1 ? 'Billets postés' : 'Billet posté'),
		url: '/blog/categories/' + category_id + '/posts',
		icon: 'md-blog-detail'
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
	},

	onRefreshPosts: function(count) {
		if (count == null) {
			this.overview.fetch().done(function() {
				this.render();
			}.bind(this));
			return;
		}

		if (this.overview.get('posts_count') + count < 0) {
			this.overview.set('posts_count', 0);
		} else {
			this.overview.set('posts_count', this.overview.get('posts_count') + count);
		}

		this.render();
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

	showPostsByCategory: function(category_id, queryString) {
		this.showGlobalPosts(queryString, category_id);
	},

	showPosts: function(queryString) {
		this.showGlobalPosts(queryString, null);
	},

	showGlobalPosts: function(queryString, category_id) {

		var qs = this.parseQueryString(queryString, {
			'term': null
		});

		var promise;
		var c = new Posts();
		var title = 'Tous les billets postés';
		var tabs = null;
		var categs = new Categories();
		if (category_id) {
			var categorie = new categs.model({
				category_id: category_id
			});
			promise = categorie.fetch().done(function() {
				title = categorie.get('name');
				tabs = HeaderTabscategory(category_id, categorie.get('posts_count'));
			});
			qs.category_id = category_id;
		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		promise.done(function() {

			var view = new PostsView({
				collection: c,
				categories: categs,
				filters: qs
			});

			this.listenTo(c, 'bulk:delete', function(action) {
				this.triggerSidebarMenu('refresh:posts', -action.ids.length);
			});

			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
					title: title
				},
				getHeadersAction(),
				tabs);

		}.bind(this)).fail(this.failHandler('Catégorie introuvable'));
	},

	showPost: function(id) {

		var c = new Posts();
		var m = new c.model({
			post_id: id
		});

		m.fetch({
			data: {
				extra_fields: 'defaults'
			}
		}).done(function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			var categories = new Categories();
			categories.fetch();
			var view = new PostView({
				model: m,
				categories: categories,
				typesSource: m.getTypes({
					structure: true
				}),
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout')
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('title')) {
					this.setBreadCrum({
						title: model.get('title')
					}, true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.triggerSidebarMenu('refresh:posts', -1);
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
		}.bind(this)).fail(this.failHandler('Billet introuvable'));
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

			var c = new Posts();
			var m = new c.model({
				title: 'Intitulé par défaut',
				slug: Forms.tmpSlug(),
				is_visible: false,
				has_comments_open: true,
				publication_date: moment().format('YYYY-MM-DD hh:mm:ss'),
				category_id: categories.at(0).get('category_id')
			});

			return m.save().done(function() {
				that.triggerSidebarMenu('refresh:posts', 1);
				that.navigationController.showOverlay(300);
				that.navigationController.navigate('/blog/posts/' + m.get('post_id'));
			}).fail(function(error) {
				that.navigationController.showErrorModal(error);
			});
		});
	},

	/*
	 * Home
	 */

	showHome: function() {

		var m = new Home();
		m.fetch({
			data: {
				extra_fields: 'defaults'
			}
		}).done(function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			var view = new HomeView({
				collection: new Categories(),
				model: m,
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout')
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
		}.bind(this)).fail(this.failHandler('Acccueil du blog introuvable'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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

			var posts = new Posts();
			var post = new posts.model({
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
		}.bind(this)).fail(this.failHandler('Billet introuvable'));
	},

	/*
	 * Categories
	 */

	showCategory: function(id) {

		var c = new Categories();
		var m = new c.model({
			category_id: id
		});
		m.fetch({
			data: {
				extra_fields: 'defaults'
			}
		}).done(function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			var view = new CategoryView({
				model: m,
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout')
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
		}.bind(this)).fail(this.failHandler('Catégorie introuvable'));
	},

	actionNewCategory: function() {

		var c = new Categories();
		var m = new c.model({
			name: 'Intitulé par défaut',
			slug: Forms.tmpSlug(),
			is_visible: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/blog/categories/' + m.get('category_id'));
			this.triggerSidebarMenu('refresh:categories');
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));

	},

	/*
	 * Others
	 */

	actionPreview: function(model) {
		window.open(model.previewLink);
	}

});

module.exports = Router.extend({
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
		'blog/categories/:id/posts': 'showPostsByCategory'
	},

	onRoute: function(name) {
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:blog')) {
			this.controller.navigationController.navigate('/');
			return false;
		}
		this.controller.showSidebarMenu();
	}

});
