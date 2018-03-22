var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Injectcode = require('../prefs/models/meta');
var Analytics = require('./models/analytics');
var Redirections = require('./models/redirections');
var Subscribers = require('./models/subscribers');
var Vouchers = require('./models/vouchers');
var Customers = require('kiubi/modules/customers/models/customers');
var Groups = require('kiubi/modules/customers/models/groups');
var Categories = require('kiubi/modules/catalog/models/categories');
var Products = require('kiubi/modules/catalog/models/products');
var Carriers = require('kiubi/modules/checkout/models/carriers');
var Fidelity = require('kiubi/modules/prefs/models/fidelity');
var Iadvize = require('kiubi/modules/prefs/models/iadvize');
var AvisVerifies = require('kiubi/modules/prefs/models/avisverifies');
var Lengow = require('kiubi/modules/prefs/models/lengow');
var Backups = require('./models/backups');
var MerchantCenter = require('kiubi/modules/prefs/models/merchantcenter');
var ImportProducts = require('./models/import.products');
var ImportPosts = require('./models/import.posts');
var Menus = require('kiubi/modules/cms/models/menus');
var Post = require('kiubi/modules/cms/models/post');

/* Views */
var IndexView = require('./views/index');
var InjectcodeView = require('./views/injectcode');
var RedirectionsView = require('./views/redirections');
var FidelityView = require('./views/fidelity');
var AnalyticsView = require('./views/analytics');
var VouchersView = require('./views/vouchers');
var VoucherView = require('./views/voucher');
var SubscribersView = require('./views/subscribers');
var ImportPostsView = require('./views/import.posts');
var ImportProductsView = require('./views/import.products');
var ImportWordpressView = require('./views/import.wordpress');
var MerchantCenterView = require('./views/merchantcenter');
var LengowView = require('./views/lengow');
var IadvizeView = require('./views/iadvize');
var AvisVerifiesView = require('./views/avisverifies');
var BackupsView = require('./views/backups');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'modules',
	behaviors: [ActiveLinksBehaviors]
});

var ModulesController = Controller.extend({

	sidebarMenuService: 'modules',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Modules',
		href: '/modules'
	}],

	showIndex: function() {
		console.log('ModulesController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les modules'
		});
	},

	showInjectcode: function() {
		var m = new Injectcode();
		m.fetch().done(function() {
			this.navigationController.showContent(new InjectcodeView({
				model: m
			}));
			this.setHeader({
				title: 'Injection de code'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showRedirections: function() {
		var c = new Redirections();
		c.fetch().done(function() {
			this.navigationController.showContent(new RedirectionsView({
				collection: c
			}));
			this.setHeader({
				title: 'Redirections 301'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showFidelity: function() {
		var m = new Fidelity();
		m.fetch().done(function() {
			this.navigationController.showContent(new FidelityView({
				model: m
			}));
			this.setHeader({
				title: 'Points de fidélité'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showAnalytics: function() {
		var m = new Analytics();
		m.fetch().done(function() {
			this.navigationController.showContent(new AnalyticsView({
				model: m
			}));
			this.setHeader({
				title: 'Google Analytics'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showVouchers: function() {
		var view = new VouchersView({
			collection: new Vouchers()
		});

		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Tous les bons de réduction'
		});
	},

	showVoucher: function(id) {

		var c = new Vouchers();
		var m = new c.model({
			voucher_id: id
		});

		m.fetch().done(function() {
			var view = new VoucherView({
				model: m,
				customers: new Customers(),
				groups: new Groups(),
				categories: new Categories(),
				products: new Products(),
				carriers: new Carriers()
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('code')) {
					this.setBreadCrum([{
						href: '/modules/vouchers',
						title: 'Bons de réduction'
					}, {
						title: model.get('code')
					}], true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/modules/vouchers');
			});
			this.navigationController.showContent(view);
			this.setHeader([{
				href: '/modules/vouchers',
				title: 'Bons de réduction'
			}, {
				title: m.get('code')
			}], [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Bon de réduction introuvable'
			});
		}.bind(this));
	},

	showSubscribers: function() {

		var view = new SubscribersView({
			collection: new Subscribers()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Abonnés à la newsletter'
		});

	},

	showImportPosts: function() {
		this.navigationController.showContent(new ImportPostsView({
			model: new ImportPosts(),
			post: new Post(),
			menus: new Menus()
		}));
		this.setHeader({
			title: 'Import de billets dans le site web'
		});
	},

	showImportProducts: function() {
		this.navigationController.showContent(new ImportProductsView({
			model: new ImportProducts(),
			categories: new Categories()
		}));
		this.setHeader({
			title: 'Import de produits dans le catalogue'
		});
	},

	showImportWordpress: function() {
		console.log('ModulesController, showImportWordpress');

		this.navigationController.showContent(new ImportWordpressView());
		this.setHeader({
			title: 'Import depuis Wordpress'
		});
	},

	showMerchantCenter: function() {
		var m = new MerchantCenter();
		m.fetch().done(function() {
			this.navigationController.showContent(new MerchantCenterView({
				model: m
			}));
			this.setHeader({
				title: 'Google Merchant Center'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showLengow: function() {
		var m = new Lengow();
		m.fetch().done(function() {
			this.navigationController.showContent(new LengowView({
				model: m,
				categories: new Categories()
			}));
			this.setHeader({
				title: 'Lengow'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showIadvize: function() {
		var m = new Iadvize();
		m.fetch().done(function() {
			this.navigationController.showContent(new IadvizeView({
				model: m
			}));
			this.setHeader({
				title: 'iAdvize'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showAvisVerifies: function() {
		var m = new AvisVerifies();
		m.fetch().done(function() {
			this.navigationController.showContent(new AvisVerifiesView({
				model: m
			}));
			this.setHeader({
				title: 'Avis Vérifiés'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showBackups: function() {

		var view = new BackupsView({
			collection: new Backups()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Gestion des sauvegardes'
		}, [{
			title: 'Créer un point de sauvegarde',
			callback: 'actionNewBackup'
		}]);

	},

	actionNewBackup: function() {

		this.navigationController.showOverlay();
		var c = new Backups();
		return c.createBackup().done(function(error) {

			if (error != '') {
				this.navigationController.showErrorModal(error, 4000);
				return;
			}
			this.navigationController.hideModal();

			var view = this.navigationController.getContent();
			if (view && view.start) {
				view.start();
			}
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));

	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new ModulesController(),
	appRoutes: {
		'modules': 'showIndex',
		'modules/injectcode': 'showInjectcode',
		'modules/redirections': 'showRedirections',
		'modules/fidelity': 'showFidelity',
		'modules/analytics': 'showAnalytics',
		'modules/vouchers': 'showVouchers',
		'modules/vouchers/:id': 'showVoucher',
		'modules/subscribers': 'showSubscribers',
		'modules/import/posts': 'showImportPosts',
		'modules/import/products': 'showImportProducts',
		'modules/import/wordpress': 'showImportWordpress',
		'modules/merchantcenter': 'showMerchantCenter',
		'modules/lengow': 'showLengow',
		'modules/iadvize': 'showIadvize',
		'modules/avisverifies': 'showAvisVerifies',
		'modules/backups': 'showBackups'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
