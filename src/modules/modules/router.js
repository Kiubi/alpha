var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var moment = require('moment');
var _ = require('underscore');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

/* Models */
var Injectcode = require('../prefs/models/meta');
var Analytics = require('./models/analytics');
var Redirections = require('./models/redirections');
var Subscribers = require('./models/subscribers');
var Newsletter = require('kiubi/modules/prefs/models/newsletter');
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
var ImportColiship = require('./models/import.coliship');
var ImportMondialrelay = require('./models/import/mondialrelay');
var ImportContents = require('./models/import.contents');
var ImportWordpress = require('./models/import.wordpress');
var ImportFiles = require('./models/import.files');
var Menus = require('kiubi/modules/cms/models/menus');
var Posts = require('kiubi/modules/cms/models/posts');
var Folders = require('kiubi/modules/media/models/folders');
var Medias = require('kiubi/modules/prefs/models/medias');
var Captcha = require('kiubi/modules/prefs/models/captcha');
var Ads = require('kiubi/modules/prefs/models/ads');
var Symbols = require('kiubi/modules/cms/models/symbols');
var TierPrices = require('./models/tier_prices');
var Apps = require('./models/apps');

/* Views */
var IndexView = require('./views/index');
var InjectcodeView = require('./views/injectcode');
var RedirectionsView = require('./views/redirections');
var FidelityView = require('./views/fidelity');
var AnalyticsView = require('./views/analytics');
var AdsView = require('./views/ads');
var VouchersView = require('./views/vouchers');
var VoucherView = require('./views/voucher');
var VoucherAddModalView = require('./views/modal.voucher.add');
var NewsletterView = require('./views/subscribers.settings');
var SubscribersView = require('./views/subscribers');
var ImportContentsView = require('./views/import.contents');
var ImportProductsView = require('./views/import.products');
var ImportColishipView = require('./views/import.coliship');
var ImportMondialrelayView = require('./views/import/mondialrelay');
var ImportWordpressView = require('./views/import.wordpress');
var ImportFilesView = require('./views/import.files');
var MerchantCenterView = require('./views/merchantcenter');
var LengowView = require('./views/lengow');
var IadvizeView = require('./views/iadvize');
var AvisVerifiesView = require('./views/avisverifies');
var BackupsView = require('./views/backups');
var CaptchaView = require('./views/captcha');
var AppView = require('./views/app');
var KpsView = require('./views/kps');
var TierPricesView = require('./views/tier_prices');
var TierPricesGridView = require('./views/tier_prices_grid');
var SidebarMenuView = require('./views/sidebarMenu');

/* Actions */
function getHeadersActionVouchers(options) {

	options = options || {};
	var actions = [{
		title: 'Ajouter une réduction',
		callback: 'showVoucherAdd'
	}];

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

function getHeadersActionTierPrices(options) {

	options = options || {};
	var actions = [{
		title: 'Ajouter une grille',
		callback: 'actionNewTPGrid'
	}];

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
function HeaderTabsSubscribers() {

	return [{
		title: 'Liste des abonnés',
		url: '/modules/subscribers',
		icon: 'md-newsletter-detail'

	}, {
		title: 'Paramètres',
		url: '/modules/subscribers/settings',
		icon: 'md-newsletter-settings'
	}];
}

/* Tabs  */
function HeaderTabsIndex() {

	return [{
		title: 'Modules & Applications',
		url: '/modules',
		icon: 'md-extension'

	}, {
		title: 'Kiubi Professional Services',
		url: '/modules/kps',
		icon: 'md-modules-kps'
	}];
}

/*
function HeaderTabsAppStore() {

	return [{
		title: 'Modules installés',
		url: '/modules'
	}, {
		title: 'App Store',
		url: '/modules/appstore'
	}];
}
*/

function ctlScope(name) {
	switch (name) {
		case 'showInjectcode':
		case 'showRedirections':
			return 'site:seo';
		case 'showFidelity':
		case 'showAnalytics':
			return 'site:modules';
		case 'showVouchers':
		case 'showVoucher':
		case 'showSubscribers':
		case 'showSubscribersSettings':
		case 'showMerchantCenter':
		case 'showLengow':
		case 'showIadvize':
		case 'showAvisVerifies':
			return 'site:marketing';
		case 'showImportPosts':
			return 'site:cms';
		case 'showImportProducts':
			return 'site:catalog';
		case 'showImportColiship':
		case 'showImportMondialrelay':
			return 'site:checkout';
		case 'showImportWordpress':
			return 'site:blog';
		case 'showBackups':
			return 'site:backup';
	}
	return null;
}

function ctlFeature(name) {
	switch (name) {
		case 'showFidelity':
			return 'fidelity';
		case 'showVouchers':
		case 'showVoucher':
		case 'showLengow':
		case 'showAvisVerifies':
		case 'showMerchantCenter':
		case 'showImportColiship':
		case 'showImportMondialrelay':
			return 'checkout';
		case 'showImportProducts':
			return 'catalog';
		case 'showImportFiles':
			return 'advanced_media';
	}
	return null;
}

var ModulesController = Controller.extend({

	sidebarMenuService: 'modules',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Modules',
		href: '/modules'
	}],

	showIndex: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		this.navigationController.showContent(new IndexView({
			apps: Session.hasFeature('apps') ? new Apps() : null
		}));
		this.setHeader({
			title: 'Tous les modules'
		}, null, HeaderTabsIndex());

	},

	showApp: function(id) {
		var c = (new Apps());
		var m = new c.model({
			app_id: id
		});
		m.fetch().done(function() {
			var view = new AppView({
				model: m
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			});
		}.bind(this)).fail(this.failHandler('Application introuvable'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
	},

	showAds: function() {
		var m = new Ads();
		m.fetch().done(function() {
			this.navigationController.showContent(new AdsView({
				model: m
			}));
			this.setHeader({
				title: 'Authorized Digital Sellers (ADS)'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
	},

	showVouchers: function() {
		var view = new VouchersView({
			collection: new Vouchers()
		});

		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Tous les bons de réduction'
		}, getHeadersActionVouchers({
			addSave: false
		}));
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
			}], getHeadersActionVouchers({
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Bon de réduction introuvable'));
	},

	actionNewVoucher: function(type) {
		var c = new Vouchers();

		var data = {
			type: type,
			code: 'BON', // default code
			start_date: moment().format('YYYY-MM-DD'),
			end_date: moment().add(1, 'years').format('YYYY-MM-DD')
		};

		switch (type) {
			case 'amount':
				data.value = '1'; // 1 currency discount by default
				data.threshold = '10'; // at least 10 currency order
				break;
			case 'percent':
				data.value = '1'; // 1% discount by default
				break;
			case 'shipping':
				data.carrier_id = null; // TODO
				break;
		}

		var m = new c.model(data);

		// handlers
		var done = function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/modules/vouchers/' + m.get('voucher_id'));
		}.bind(this);
		var fail = function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this);

		if (type == 'shipping') {
			// Search first carrier
			var ca = new Carriers();
			return ca.fetch().then(function(data) {

				var selection = ca.find(function(model) {
					return model.get('type') != 'magasin';
				});
				if (!selection) {
					this.navigationController.showErrorModal('Aucun transporteur trouvé');
					return Backbone.$.Deferred.reject();
				}

				m.set('carrier_id', selection.get('carrier_id'));
				return m.save().done(done).fail(fail);
			}.bind(this), fail);
		} else {
			return m.save().done(done).fail(fail);
		}
	},

	showSubscribers: function() {

		var view = new SubscribersView({
			collection: new Subscribers()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Abonnés à la newsletter'
		}, null, HeaderTabsSubscribers());

	},

	showSubscribersSettings: function() {
		var m = new Newsletter();
		m.fetch().done(function() {
			this.navigationController.showContent(new NewsletterView({
				model: m
			}));
			this.setHeader({
				title: 'Abonnés à la newsletter'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsSubscribers());
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
	},

	showImportContents: function() {
		this.navigationController.showContent(new ImportContentsView({
			model: new ImportContents(),
			menus: new Menus(),
			symbols: new Symbols()
		}));
		this.setHeader({
			title: 'Import de contenus dans le site web'
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

	showImportColiship: function() {
		this.navigationController.showContent(new ImportColishipView({
			model: new ImportColiship()
		}));
		this.setHeader({
			title: 'Import Coliship'
		});
	},

	showImportMondialrelay: function() {
		this.navigationController.showContent(new ImportMondialrelayView({
			model: new ImportMondialrelay()
		}));
		this.setHeader({
			title: 'Import Mondial Relay'
		});
	},

	showImportWordpress: function() {
		var posts = new Posts();
		this.navigationController.showContent(new ImportWordpressView({
			model: new ImportWordpress(),
			post: new posts.model()
		}));
		this.setHeader({
			title: 'Import depuis Wordpress'
		});
	},

	showImportFiles: function() {

		var m = new Medias();

		m.fetch().always(function() {
			this.navigationController.showContent(new ImportFilesView({
				model: new ImportFiles(),
				folders: new Folders(),
				prefs: m
			}));
			this.setHeader({
				title: 'Import de fichiers dans la Médiathèque'
			});
		}.bind(this));

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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
	},

	showCaptcha: function() {
		var m = new Captcha();
		m.fetch().done(function() {
			this.navigationController.showContent(new CaptchaView({
				model: m
			}));
			this.setHeader({
				title: 'Google reCaptcha'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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

	showKps: function() {
		this.navigationController.showContent(new KpsView());
		this.setHeader({
			title: 'Kiubi Professionnal Services'
		}, null, HeaderTabsIndex());

	},

	actionNewBackup: function() {

		this.navigationController.showOverlay();
		var c = new Backups();
		return c.createBackup().done(function(errorOrdata) {

			if (errorOrdata != '') {
				this.navigationController.showErrorModal(errorOrdata, 4000);
				return;
			}
			this.navigationController.hideModal();

			var view = this.navigationController.getContent();
			if (view && view.start) {
				view.start();
			}
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));

	},

	showTierPrices: function() {
		var view = new TierPricesView({
			collection: new TierPrices()
		});

		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Tous les tarifs dégressifs'
		}, getHeadersActionTierPrices({
			addSave: false
		}));
	},

	showTierPricesGrid: function(id) {

		var c = new TierPrices();
		var m = new c.model({
			grid_id: id
		});

		m.fetch().done(function() {
			var view = new TierPricesGridView({
				model: m,
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum([{
						href: '/modules/tier_prices',
						title: 'Tarifs dégressifs'
					}, {
						title: model.get('name')
					}], true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/modules/tier_prices');
			});
			this.navigationController.showContent(view);
			this.setHeader([{
				href: '/modules/tier_prices',
				title: 'Tarifs dégressifs'
			}, {
				title: m.get('name')
			}], getHeadersActionTierPrices({
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Grille de tarifs dégressifs introuvable'));
	},

	actionNewTPGrid: function() {

		var m = new(new TierPrices()).model({
			name: 'Grille sans titre',
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/modules/tier_prices/' + m.get('grid_id'));
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
		}.bind(this));

	},

	/*
	 * Modal
	 */

	showVoucherAdd: function(menu_id) {
		var contentView = new VoucherAddModalView();

		this.listenTo(contentView, 'select:amount', this.actionNewVoucher);
		this.listenTo(contentView, 'select:percent', this.actionNewVoucher);
		this.listenTo(contentView, 'select:shipping', this.actionNewVoucher);

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter une réduction',
			modalClass: 'modal-pagetype-add'
		});
	}

});

module.exports = Router.extend({
	controller: new ModulesController(),
	appRoutes: {
		'modules': 'showIndex',
		'modules/injectcode': 'showInjectcode',
		'modules/redirections': 'showRedirections',
		'modules/fidelity': 'showFidelity',
		'modules/analytics': 'showAnalytics',
		'modules/ads': 'showAds',
		'modules/vouchers': 'showVouchers',
		'modules/vouchers/:id': 'showVoucher',
		'modules/subscribers': 'showSubscribers',
		'modules/subscribers/settings': 'showSubscribersSettings',
		'modules/import/contents': 'showImportContents',
		'modules/import/products': 'showImportProducts',
		'modules/import/coliship': 'showImportColiship',
		'modules/import/mondialrelay': 'showImportMondialrelay',
		'modules/import/wordpress': 'showImportWordpress',
		'modules/import/files': 'showImportFiles',
		'modules/merchantcenter': 'showMerchantCenter',
		'modules/lengow': 'showLengow',
		'modules/iadvize': 'showIadvize',
		'modules/avisverifies': 'showAvisVerifies',
		'modules/captcha': 'showCaptcha',
		'modules/backups': 'showBackups',
		'modules/kps': 'showKps',
		'modules/tier_prices': 'showTierPrices',
		'modules/tier_prices/:id': 'showTierPricesGrid',
		'modules/apps/:id': 'showApp'
	},

	onRoute: function(name) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var scope = ctlScope(name);
		var feature = ctlFeature(name);
		if (scope) {
			if (!Session.hasScope(scope)) {
				this.controller.navigationController.navigate('/');
				return false;
			}
		}
		if (feature) {
			if (!Session.hasFeature(feature)) {
				this.controller.navigationController.navigate('/');
				return false;
			}
		}

		this.controller.showSidebarMenu();
	}
});
