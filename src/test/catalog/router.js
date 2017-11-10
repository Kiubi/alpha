var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller');

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

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'catalog',
	behaviors: [ActiveLinksBehaviors]
});

var CatalogController = Controller.extend({

	sidebarMenuService: 'catalog',

	baseBreadcrum: [{
		title: 'Catalogue',
		href: '/catalog'
	}],

	showIndex: function() {
		console.log('CatalogController, showIndex');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les produits'
		});
	},

	showProduct: function(id) {
		console.log('CatalogController, showProduct', id);

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new ProductView());
		this.setHeader({
			title: 'Produit ' + id
		});

	},

	showHome: function() {
		console.log('CatalogController, showHome');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new HomeView());
		this.setHeader({
			title: 'Accueil du catalogue'
		});

	},

	showCategory: function(id) {
		console.log('CatalogController, showCategory', id);

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new CategoryView());
		this.setHeader({
			title: 'Categorie ' + id
		});

	},

	showProducts: function(id) {
		console.log('CatalogController, showProducts', id);

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new ProductsView());
		this.setHeader({
			title: 'Produits de la catégorie ' + id
		});
	},

	showCategories: function() {
		console.log('CatalogController, showCategories');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new CategoriesView());
		this.setHeader({
			title: 'Toutes les catégories'
		});
	},

	showComments: function(id) {
		console.log('CatalogController, showComments', id);

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new CommentsView());
		this.setHeader({
			title: id > 0 ? 'Évaluations du produit ' + id : 'Toutes les évaluations'
		});
	},

	showLinked: function(id) {
		console.log('CatalogController, showLinked', id);

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new LinkedView());
		this.setHeader({
			title: 'Produits associés à ' + id
		});
	},

	showSettings: function() {
		console.log('CatalogController, showSettings');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new SettingsView());
		this.setHeader({
			title: 'Paramètres du catalogue'
		});
	},

	showTaxes: function() {
		console.log('CatalogController, showTaxes');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new TaxesView());
		this.setHeader({
			title: 'Gestion des taxes'
		});
	},

	showTags: function() {
		console.log('CatalogController, showTags');

		this.showSidebarMenu(SidebarMenuView);
		this.navigationController.showContent(new TagsView());
		this.setHeader({
			title: 'Tous les tags'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CatalogController(),
	appRoutes: {
		'test/catalog': 'showIndex',
		'test/catalog/home': 'showHome',
		'test/catalog/products/:id': 'showProduct',
		'test/catalog/products/:id/comments': 'showComments',
		'test/catalog/products/:id/linked': 'showLinked',
		'test/catalog/categories': 'showCategories',
		'test/catalog/categories/:id': 'showCategory',
		'test/catalog/categories/:id/products': 'showProducts',
		'test/catalog/comments': 'showComments',
		'test/catalog/settings': 'showSettings',
		'test/catalog/taxes': 'showTaxes',
		'test/catalog/tags': 'showTags'
	}
});
