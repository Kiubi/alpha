var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Injectcode = require('../prefs/models/meta');
var Rss = require('./models/rss');
var Analytics = require('./models/analytics');

/* Views */
var IndexView = require('./views/index');
var InjectcodeView = require('./views/injectcode');
var RedirectionsView = require('./views/redirections');
var FidelityView = require('./views/fidelity');
var RssView = require('./views/rss');
var AnalyticsView = require('./views/analytics');
var VouchersView = require('./views/vouchers');
var VoucherView = require('./views/voucher');
var SubscribersView = require('./views/subscribers');
var ImportCmsView = require('./views/import.cms');
var ImportCatalogView = require('./views/import.catalog');
var ImportWordpressView = require('./views/import.wordpress');
var MerchantCenterView = require('./views/merchantcenter');
var LengowView = require('./views/lengow');
var IadvizeView = require('./views/iadvize');
var AvisVerifiesView = require('./views/avisverifies');
var BackupView = require('./views/backup');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('kiubi/templates/sidebarMenu.empty.html'),
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

		this.navigationController.underConstruction();
		return;

		console.log('ModulesController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les modules'
		});
	},

	showInjectcode: function() {
		var m = new Injectcode();
		m.fetch().done(function() {
			var view = new InjectcodeView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Injection de code'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showRedirections: function() {
		console.log('ModulesController, showRedirections');

		this.navigationController.showContent(new RedirectionsView());
		this.setHeader({
			title: 'Redirections 301'
		});
	},

	showFidelity: function() {
		console.log('ModulesController, showFidelity');

		this.navigationController.showContent(new FidelityView());
		this.setHeader({
			title: 'Points de fidélité'
		});
	},

	showRss: function() {
		var m = new Rss();
		m.fetch().done(function() {
			var view = new RssView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Syndication'
			});
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
			var view = new AnalyticsView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Google Analytics'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showVouchers: function() {
		console.log('ModulesController, showVouchers');

		this.navigationController.showContent(new VouchersView());
		this.setHeader({
			title: 'Tous les bons de réduction'
		});
	},

	showVoucher: function(id) {
		console.log('ModulesController, showVoucher', id);

		this.navigationController.showContent(new VoucherView());
		this.setHeader({
			title: 'Détail du bon de réduction ' + id
		});
	},

	showSubscribers: function() {
		console.log('ModulesController, showSubscribers');

		this.navigationController.showContent(new SubscribersView());
		this.setHeader({
			title: 'Abonnés à la newsletter'
		});
	},

	showImportCms: function() {
		console.log('ModulesController, showImportCms');

		this.navigationController.showContent(new ImportCmsView());
		this.setHeader({
			title: 'Import de billets dans le site web'
		});
	},

	showImportCatalog: function() {
		console.log('ModulesController, showImportCatalog');

		this.navigationController.showContent(new ImportCatalogView());
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
		console.log('ModulesController, showMerchantCenter');

		this.navigationController.showContent(new MerchantCenterView());
		this.setHeader({
			title: 'Google Merchant Center'
		});
	},

	showLengow: function() {
		console.log('ModulesController, showLengow');

		this.navigationController.showContent(new LengowView());
		this.setHeader({
			title: 'Lengow'
		});
	},

	showIadvize: function() {
		console.log('ModulesController, showIadvize');

		this.navigationController.showContent(new IadvizeView());
		this.setHeader({
			title: 'iAdvize'
		});
	},

	showAvisVerifies: function() {
		console.log('ModulesController, showAvisVerifies');

		this.navigationController.showContent(new AvisVerifiesView());
		this.setHeader({
			title: 'Avis Vérifiés'
		});
	},

	showBackup: function() {
		console.log('ModulesController, showBackup');

		this.navigationController.showContent(new BackupView());
		this.setHeader({
			title: 'Gestion des sauvegardes'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new ModulesController(),
	appRoutes: {
		'modules': 'showIndex',
		/*'modules/injectcode': 'showInjectcode',
		'modules/redirections': 'showRedirections',
		'modules/fidelity': 'showFidelity',
		'modules/rss': 'showRss',
		'modules/analytics': 'showAnalytics',
		'modules/vouchers': 'showVouchers',
		'modules/vouchers/:id': 'showVoucher',
		'modules/subscribers': 'showSubscribers',
		'modules/import/cms': 'showImportCms',
		'modules/import/catalog': 'showImportCatalog',
		'modules/import/wordpress': 'showImportWordpress',
		'modules/merchantcenter': 'showMerchantCenter',
		'modules/lengow': 'showLengow',
		'modules/iadvize': 'showIadvize',
		'modules/avisverifies': 'showAvisVerifies',
		'modules/backup': 'showBackup'*/
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
