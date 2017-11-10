var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Catalog = require('./models/catalog');
var Category = require('./models/category');
var Categories = require('./models/categories');
var Products = require('./models/products');
var Comments = require('./models/comments');
var Taxes = require('./models/taxes');
var Settings = require('./models/settings');

/* Views */
var IndexView = require('./views/index');
var ProductView = require('./views/product');
var HomeView = require('./views/home');
var CategoryView = require('./views/category');
var ProductsView = require('./views/products');
var CategoriesView = require('./views/categories');
var CommentsView = require('./views/comments');
var LinkedView = require('./views/linked');
var SettingsView = require('./views/settings');
var TaxesView = require('./views/taxes');
var TagsView = require('./views/tags');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	/*if (options.addSave) {
		actions.push({
			title: 'Enregistrer',
			callback: 'actionSave'
		});
	}

	if (options.addComments) {
		actions.push({
			title: 'Rédiger un commentaire',
			callback: 'actionNewComment'
		});
	}

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
	}*/

	return actions;
}

/* Tabs  */
function HeaderTabscategory(category_id, nb) {
	return [{
		title: 'Détail de la catégorie',
		url: '/catalog/categories/' + category_id
	}, {
		title: 'Produits disponibles (' + nb + ')',
		url: '/catalog/categories/' + category_id + '/products'
	}];
}

/* Tabs  */
function HeaderTabsProduct(product_id, nb) {
	return [{
		title: 'Détail du produit',
		url: '/catalog/products/' + product_id
	}, {
		title: 'Evaluations (' + nb + ')',
		url: '/catalog/products/' + product_id + '/comments'
	}];
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('kiubi/templates/sidebarMenu.empty.html'),
	service: 'catalog',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.overview = new Catalog();

		this.fetchAndRender();
	},

	fetchAndRender: function() {
		Backbone.$.when(
			this.overview.fetch()
		).done(function() {
			this.render();
		}.bind(this)).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	templateContext: function() {
		return {
			overview: this.overview.toJSON()
		};
	}
});

var CatalogController = Controller.extend({

	sidebarMenuService: 'catalog',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Catalogue',
		href: '/catalog'
	}],

	showIndex: function() {

		this.navigationController.underConstruction();
		return;

		console.log('CatalogController, showIndex');


		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les produits'
		});
	},

	/*
	 * Products
	 */

	showProducts: function() {

		var m = new Products();
		m.fetch({
			data: {
				extra_fields: 'price_label,categories'
			}
		}).done(function() {
			var view = new ProductsView({
				collection: m
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Tous les produits'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Produits introuvables'
			});
		}.bind(this));
	},

	showProduct: function(id) {
		console.log('CatalogController, showProduct', id);


		this.navigationController.showContent(new ProductView());
		this.setHeader({
			title: 'Produit ' + id
		});

	},

	showHome: function() {
		console.log('CatalogController, showHome');


		this.navigationController.showContent(new HomeView());
		this.setHeader({
			title: 'Accueil du catalogue'
		});

	},

	/*
	 * Category
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
					//ControllerChannel.trigger('refresh:categories');
				}
			}.bind(this));
			this.listenTo(view, 'delete:category', this.actionDeletedCategory);
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m.previewLink,
				addSave: true
			}), HeaderTabscategory(id, m.get('product_count')));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Catégorie introuvable'
			});
		}.bind(this));
	},

	actionDeletedCategory: function() {
		this.navigationController.showOverlay(300);
		this.navigationController.navigate('/catalog');
		//ControllerChannel.trigger('refresh:categories');
	},

	actionNewCategory: function() {

		var m = new Category({
			name: 'Intitulé par défaut',
			slug: 'intitule-par-defaut',
			is_visible: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/catalog/categories/' + m.get('category_id'));
			//ControllerChannel.trigger('refresh:categories');
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));

	},

	/*
	 * Categories
	 */

	showCategories: function() {

		var m = new Categories();
		m.fetch().done(function() {
			var view = new CategoriesView({
				collection: m
			});
			view.start();
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Toutes les catégories'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Catégories introuvables'
			});
		}.bind(this));
	},

	/*
	 * Comments
	 */

	showComments: function(product_id) {

		var promise;
		var c = new Comments();
		var title = 'Toutes les évaluations';
		var tabs = null;
		if (product_id > 0) {
			c.product_id = product_id;

			var product = new Product({
				product_id: product_id
			});
			promise = product.fetch().done(function() {

				title = product.get('title');
				tabs = HeaderTabsProduct(product_id, product.get('comments_count'));
			});

		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		promise.done(function() {
			var view = new CommentsView({
				collection: c
			});
			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
					title: title
				},
				getHeadersAction({
					addComments: true
				}),
				tabs);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Produit introuvable'
			});
		}.bind(this));
	},

	actionNewComment: function() {

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
				title: 'Paramètres du catalogue'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	/*
	 * Taxes
	 */

	showTaxes: function() {

		var m = new Settings();
		m.fetch().done(function() {
			var view = new TaxesView({
				collection: new Taxes(),
				model: m
			});
			this.navigationController.showContent(view);
			/*view.start();*/
			this.setHeader({
				title: 'Gestion des taxes'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Gestion des taxes introuvables'
			});
		}.bind(this));
	},

	showLinked: function() {
		console.log('CheckoutController, showLinked');

		this.navigationController.showContent(new LinkedView());
		this.setHeader({
			title: 'Produits associés'
		});
	},

	showTags: function() {
		console.log('CatalogController, showTags');


		this.navigationController.showContent(new TagsView());
		this.setHeader({
			title: 'Tous les tags'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CatalogController(),
	appRoutes: {
		'catalog': 'showIndex',
		'catalog/comments': 'showIndex',
		/*'catalog': 'showProducts',
		'catalog/home': 'showHome',
		'catalog/products/:id': 'showProduct',
		'catalog/products/:id/comments': 'showComments',
		'catalog/products/:id/linked': 'showLinked',
		'catalog/categories': 'showCategories',
		'catalog/categories/:id': 'showCategory',
		'catalog/categories/:id/products': 'showProducts',
		'catalog/comments': 'showComments',
		'catalog/settings': 'showSettings',
		'catalog/taxes': 'showTaxes',
		'catalog/tags': 'showTags'*/
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
