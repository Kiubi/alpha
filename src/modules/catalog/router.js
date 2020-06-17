var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Forms = require('kiubi/utils/forms.js');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

/* Models */
var Catalog = require('./models/catalog');
var Category = require('./models/category');
var Home = require('./models/home');
var Categories = require('./models/categories');
var Brands = require('./models/brands');
var Tags = require('./models/tags');
var Product = require('./models/product');
var Products = require('./models/products');
var Variants = require('./models/variants');
var VariantsNames = require('./models/variants_names');
var Images = require('./models/images');
var Comments = require('./models/comments');
var Taxes = require('./models/taxes');
var Linked = require('./models/linked');
var Settings = require('./models/settings');
var Files = require('./models/downloads');
var Folders = require('./models/folders');
var TierPrices = require('kiubi/modules/modules/models/tier_prices');

/* Views */
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
var BrandsView = require('./views/brands');
var VariantsView = require('./views/variants');

var SelectModalView = require('kiubi/modules/media/views/modal.picker');
var PublishModalView = require('kiubi/modules/media/views/modal.publish.js');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];


	actions = actions.concat(
		[{
			title: 'Ajouter un produit',
			callback: ['actionNewProduct', options.targetCategory || null] // category_id
		}, {
			title: 'Ajouter un produit virtuel',
			callback: ['actionNewDownload', options.targetCategory || null] // category_id
		}, {
			title: 'Ajouter une catégorie',
			callback: 'actionNewCategory'
		}]
	);

	if (options.duplicateProduct) {
		actions.push({
			title: 'Dupliquer',
			icon: 'md-duplicate',
			isOptional: true,
			callback: ['actionDuplicateProduct', options.duplicateProduct] // product_id
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
function HeaderTabscategory(category_id, nb) {
	return [{
		title: 'Catégorie',
		url: '/catalog/categories/' + category_id,
		icon: 'md-catalog-categ'
	}, {
		//title: nb + ' ' + (nb > 1 ? 'produits en vente' : 'produit en vente'),
		title: 'Produits en vente',
		url: '/catalog/categories/' + category_id + '/products',
		icon: 'md-catalog-detail'
	}];
}

function HeaderTabsProduct(product_id, nb, rate) {

	return [{
		title: 'Produit',
		url: '/catalog/products/' + product_id,
		icon: 'md-catalog-detail'
	}, {
		title: 'Produits associés',
		url: '/catalog/products/' + product_id + '/linked',
		icon: 'md-catalog-linked'
	}, {
		title: nb + ' ' + (nb > 1 ? 'Évaluations' : 'Évaluation'),
		url: '/catalog/products/' + product_id + '/comments',
		icon: 'md-rating'
	}];
}

function HeaderTagsTabs() {
	return [{
		title: 'Variantes',
		url: '/catalog/variants',
		icon: 'md-catalog-variants'
	}, {
		title: 'Tags',
		url: '/catalog/tags',
		icon: 'md-catalog-tags'
	}, {
		title: 'Marques',
		url: '/catalog/brands',
		icon: 'md-catalog-brands'
	}];
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'catalog',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.overview = new Catalog();

		this.fetchAndRender();
	},

	templateContext: function() {
		return {
			overview: this.overview.toJSON()
		};
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

	onRefreshProducts: function(count) {
		if (count == null) {
			this.overview.fetch().done(function() {
				this.render();
			}.bind(this));
			return;
		}

		if (this.overview.get('products_count') + count < 0) {
			this.overview.set('products_count', 0);
		} else {
			this.overview.set('products_count', this.overview.get('products_count') + count);
		}

		this.render();
	}

});

var CatalogController = Controller.extend({

	sidebarMenuService: 'catalog',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Catalogue',
		href: '/catalog'
	}],

	/*
	 * Products
	 */

	showProductsByCategory: function(category_id, queryString) {
		this.showGlobalProducts(queryString, category_id);
	},

	showProducts: function(queryString) {
		this.showGlobalProducts(queryString, null);
	},

	showGlobalProducts: function(queryString, category_id) {

		var qs = this.parseQueryString(queryString, {
			'term': null,
			'stock': null,
			'tier_prices': null
		});

		var promise, m;
		category_id = parseInt(category_id);
		if (category_id) {
			m = new Category({
				category_id: category_id
			});
			promise = m.fetch();
		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		promise.done(function() {
				var c = new Products();
				var view = new ProductsView({
					collection: c,
					categories: new Categories(),
					tags: new Tags(),
					brands: new Brands(),
					tier_prices: Session.hasFeature('tier_prices') && new TierPrices(),
					category_id: category_id ? category_id : null,
					filters: qs
				});

				this.listenTo(c, 'bulk:delete', function(action) {
					this.triggerSidebarMenu('refresh:products', -action.ids.length);
				});

				this.navigationController.showContent(view);
				view.start();
				this.setHeader({
					title: category_id ? m.get('name') : 'Tous les produits'
				}, getHeadersAction({
					targetCategory: category_id ? category_id : null
				}), category_id ? HeaderTabscategory(category_id, m.get('product_count')) : null);

			}.bind(this))
			.fail(this.failHandler('Catégorie introuvable'));
	},

	showProduct: function(id) {

		var t = new Taxes();
		var m = new Product({
			product_id: id
		});

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		Backbone.$.when(t.fetch(), m.fetch({
			data: {
				extra_fields: 'texts,variants,price_label,images,defaults' + (Session.hasFeature('tier_prices') ? ',tier_prices' : '')
			}
		})).done(function() {

			var variants = new Variants();
			variants.product_id = m.get('product_id');
			var i = new Images();
			i.product_id = m.get('product_id');
			var view = new ProductView({
				model: m,
				typesSource: m.getTypes({
					structure: true
				}),
				categories: new Categories(),
				brands: new Brands(),
				tags: new Tags(),
				variants: variants,
				taxes: t,
				tier_prices: Session.hasFeature('tier_prices') && new TierPrices(),
				images: i,
				enableSeo: Session.hasScope('site:seo'),
				enableLayout: Session.hasScope('site:layout')
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.triggerSidebarMenu('refresh:products', -1);
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/catalog');
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addSave: true,
				duplicateProduct: id
			}), HeaderTabsProduct(id, m.get('comments_count'), m.get('rate')));
		}.bind(this)).fail(this.failHandler('Produit introuvable'));
	},

	actionNewProduct: function(category_id) {

		var m = new Product({
			name: 'Intitulé par défaut',
			slug: Forms.tmpSlug(),
			is_visible: false,
			stock: null,
			categories: category_id ? [category_id] : []
		});

		return m.save().done(function() {
			this.triggerSidebarMenu('refresh:products', 1);
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/catalog/products/' + m.get('product_id'));
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));

	},

	actionNewDownload: function(category_id) {

		var collection = new Files();
		var model = new(new Files()).model({
			folder_id: 8
		});

		var contentView = new SelectModalView({
			collection: collection,
			model: model,
			type: 'file',
			folders: new Folders(),
			rememberFolder: false
		});

		this.listenTo(contentView, 'close:modal', function() {
			// Media choosed
			var m = new Product({
				name: 'Intitulé par défaut',
				slug: Forms.tmpSlug(),
				is_visible: false,
				is_virtual: true,
				file_id: contentView.model.get('media_id'),
				stock: null,
				categories: category_id ? [category_id] : []
			});

			return m.save().done(function() {
				this.triggerSidebarMenu('refresh:products', 1);
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/catalog/products/' + m.get('product_id'));
			}.bind(this)).fail(function(error) {
				this.navigationController.showErrorModal(error);
			}.bind(this));
		});

		this.listenTo(contentView, 'action:modal', function(view) {
			this.actionPublishDownload(category_id, view.currentFolder);
		}.bind(this));

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter une fichier',
			action: {
				title: 'Publier'
			},
			modalClass: 'mediatheque'
		});

	},

	actionPublishDownload: function(category_id, folder_id) {
		var collection = new Files();
		collection.folder_id = folder_id ? folder_id : 8; // TODO Fix
		var model = new(new Files()).model();

		var contentView = new PublishModalView({
			isMultiFiles: false,
			collection: collection
		});

		this.listenTo(contentView, 'uploaded:files', function(collection) {

			var m = new Product({
				name: 'Intitulé par défaut',
				slug: Forms.tmpSlug(),
				is_visible: false,
				is_virtual: true,
				file_id: collection.at(0).get('media_id'),
				stock: null,
				categories: category_id ? [category_id] : []
			});

			return m.save().done(function() {
				this.triggerSidebarMenu('refresh:products', 1);
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/catalog/products/' + m.get('product_id'));
			}.bind(this)).fail(function(error) {
				this.navigationController.showErrorModal(error);
			}.bind(this));

		});

		this.navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque',
			action: {
				title: 'Publier un fichier'
			}
		});

	},

	actionDuplicateProduct: function(product_id) {
		var m = new Product({
			product_id: product_id
		});

		var navigationController = this.navigationController;

		return m.fetch().then(
			function() {
				m.duplicate({
					name: 'Copie de ' + m.get('name')
				}).done(function(duplicate) {
					navigationController.showOverlay(300);
					navigationController.navigate('/catalog/products/' + duplicate.get('product_id'));
					//ControllerChannel.trigger('refresh:categories');
				}).fail(function(error) {
					navigationController.showErrorModal(error);
				});
			},
			function(error) {
				navigationController.showErrorModal(error);
			}
		);

	},

	showLinked: function(id) {

		var m = new Product({
			product_id: id
		});

		m.fetch().done(function() {

			var c = new Linked();
			c.product_id = id;
			var view = new LinkedView({
				collection: c,
				products: new Products()
			});
			view.start();

			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				duplicateProduct: id
			}), HeaderTabsProduct(id, m.get('comments_count'), m.get('rate')));

		}.bind(this)).fail(this.failHandler('Produit introuvable'));
	},

	/*
	 * Category
	 */

	showCategory: function(id) {

		var m = new Category({
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
					//ControllerChannel.trigger('refresh:categories');
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/catalog');
				//ControllerChannel.trigger('refresh:categories');
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addSave: true,
				targetCategory: id
			}), HeaderTabscategory(id, m.get('product_count')));
		}.bind(this)).fail(this.failHandler('Catégorie introuvable'));
	},

	actionNewCategory: function() {

		var m = new Category({
			name: 'Intitulé par défaut',
			slug: Forms.tmpSlug(),
			is_visible: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/catalog/categories/' + m.get('category_id'));
			//ControllerChannel.trigger('refresh:categories');
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));

	},

	showHome: function() {

		var m = new Home();
		m.fetch({
			data: {
				extra_fields: 'defaults'
			}
		}).done(function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');

			var view = new HomeView({
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
			}.bind(this));
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, getHeadersAction({
				preview: m,
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Accueil du catalogue introuvable'));
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
			}, getHeadersAction());
		}.bind(this)).fail(this.failHandler('Catégories introuvables'));
	},

	/*
	 * Comments
	 */

	showComments: function(product_id) {

		var promise;
		var c = new Comments();
		var title = 'Toutes les évaluations';
		var tabs = null;
		var actions = {
			addComments: true
		};
		if (product_id > 0) {

			c.product_id = product_id;

			var product = new Product({
				product_id: product_id
			});
			promise = product.fetch().done(function() {

				title = product.get('name');
				tabs = HeaderTabsProduct(product_id, product.get('comments_count'), product.get('rate'));
			});
			actions.duplicateProduct = product_id;
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
				getHeadersAction(actions),
				tabs);
		}.bind(this)).fail(this.failHandler('Produit introuvable'));
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
			}, getHeadersAction({
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
			this.setHeader({
				title: 'Gestion des taxes'
			}, getHeadersAction({
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Gestion des taxes introuvable'));
	},

	showTags: function() {

		var view = new TagsView({
			collection: new Tags()
		});

		this.navigationController.showContent(view);
		view.start();

		this.setHeader({
			title: 'Tous les tags'
		}, getHeadersAction(), HeaderTagsTabs());
	},

	showBrands: function() {

		var view = new BrandsView({
			collection: new Brands()
		});

		this.navigationController.showContent(view);
		view.start();

		this.setHeader({
			title: 'Toutes les marques'
		}, getHeadersAction(), HeaderTagsTabs());
	},

	showVariants: function() {

		var view = new VariantsView({
			collection: new VariantsNames()
		});

		this.navigationController.showContent(view);
		view.start();

		this.setHeader({
			title: 'Toutes les variantes'
		}, getHeadersAction(), HeaderTagsTabs());
	},

	/*
	 * Others
	 */

	actionPreview: function(model) {
		window.open(model.previewLink);
	}

});

module.exports = Router.extend({
	controller: new CatalogController(),
	appRoutes: {
		'catalog': 'showProducts',
		'catalog/products/:id': 'showProduct',
		'catalog/products/:id/comments': 'showComments',
		'catalog/products/:id/linked': 'showLinked',
		'catalog/categories': 'showCategories',
		'catalog/home': 'showHome',
		'catalog/categories/:id': 'showCategory',
		'catalog/categories/:id/products': 'showProductsByCategory',
		'catalog/comments': 'showComments',
		'catalog/settings': 'showSettings',
		'catalog/taxes': 'showTaxes',
		'catalog/tags': 'showTags',
		'catalog/brands': 'showBrands',
		'catalog/variants': 'showVariants'
	},

	onRoute: function(name) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:catalog') || !Session.hasFeature('catalog')) {
			this.controller.navigationController.navigate('/');
			return false;
		}

		this.controller.showSidebarMenu();
	}
});
