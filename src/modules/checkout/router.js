var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Checkout = require('./models/checkout');
var Settings = require('./models/settings');

/* Views */
var IndexView = require('./views/index');
var OrderView = require('./views/order');
var AbortedView = require('./views/aborted');
var PaymentsView = require('./views/payments');
var PaymentChequeView = require('./views/payment.cheque');
var PaymentTransferView = require('./views/payment.transfer');
var PaymentPayboxView = require('./views/payment.paybox');
var PaymentPaypalView = require('./views/payment.paypal');
var PaymentCmcicView = require('./views/payment.cmcic');
var PaymentAtosView = require('./views/payment.atos');
var PaymentCyberplusView = require('./views/payment.cyberplus');
var OptionsView = require('./views/options');
var OptionView = require('./views/option');
var SettingsView = require('./views/settings');
var SettingsEmailsView = require('./views/settings.emails');
var CarriersView = require('./views/carriers');
var CarrierView = require('./views/carrier');
var CarrierShopView = require('./views/carrier.shop');
var CarrierLocalView = require('./views/carrier.local');
var CarrierLaposteView = require('./views/carrier.laposte');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('kiubi/templates/sidebarMenu.empty.html'),
	service: 'checkout',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.overview = new Checkout();

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

var CheckoutController = Controller.extend({

	sidebarMenuService: 'checkout',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Commandes',
		href: '/checkout'
	}],

	showIndex: function() {

		this.navigationController.underConstruction();
		return;

		console.log('CheckoutController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Toutes les commandes'
		});
	},

	showOrder: function(id) {
		console.log('BlogController, showOrder', id);

		this.navigationController.showContent(new OrderView());
		this.setHeader({
			title: 'Commande ' + id
		});
	},

	showAborted: function() {
		console.log('CheckoutController, showAborted');

		this.navigationController.showContent(new AbortedView());
		this.setHeader({
			title: 'Commandes abondonnées'
		});
	},

	showPayments: function() {
		console.log('CheckoutController, showPayments');

		this.navigationController.showContent(new PaymentsView());
		this.setHeader({
			title: 'Commandes abondonnées'
		});
	},

	showOptions: function() {
		console.log('CheckoutController, showOptions');

		this.navigationController.showContent(new OptionsView());
		this.setHeader({
			title: 'Options à la commande'
		});
	},

	showOption: function(id) {
		console.log('BlogController, showOption', id);

		this.navigationController.showContent(new OptionView());
		this.setHeader({
			title: 'Détail de l\'option ' + id
		});
	},

	/*
	 * Emails
	 */

	showSettingsEmails: function() {

		var m = new Settings();
		m.fetch().done(function() {
			var view = new SettingsEmailsView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Emails de confirmation'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
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
				title: 'Paramètres des commandes'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showCarriers: function() {
		console.log('CheckoutController, showCarriers');

		this.navigationController.showContent(new CarriersView());
		this.setHeader({
			title: 'Transporteurs et frais de port'
		});
	},

	showCarrier: function(id) {
		console.log('CheckoutController, showCarrier', id);

		this.navigationController.showContent(new CarrierView());
		this.setHeader({
			title: 'Détail du transporteur ' + id
		});
	},

	showCarrierLocal: function(id) {
		console.log('CheckoutController, showCarrierLocal', id);

		this.navigationController.showContent(new CarrierLocalView());
		this.setHeader({
			title: 'Détail du transporteur ' + id
		});
	},

	showCarrierShop: function() {
		console.log('CheckoutController, showCarrierShop');

		this.navigationController.showContent(new CarrierShopView());
		this.setHeader({
			title: 'Retrait en boutique'
		});
	},

	showCarrierLaposte: function() {
		console.log('CheckoutController, showCarrierLaposte');

		this.navigationController.showContent(new CarrierLaposteView());
		this.setHeader({
			title: 'Colissimo Entreprise de la Poste'
		});
	},

	showPaymentCheque: function() {
		console.log('CheckoutController, showPaymentCheque');

		this.navigationController.showContent(new PaymentChequeView());
		this.setHeader({
			title: 'Paiement par chèque'
		});
	},

	showPaymentTransfer: function() {
		console.log('CheckoutController, showPaymentTransfer');

		this.navigationController.showContent(new PaymentTransferView());
		this.setHeader({
			title: 'Paiement par virement bancaire'
		});
	},

	showPaymentPaybox: function() {
		console.log('CheckoutController, showPaymentPaybox');

		this.navigationController.showContent(new PaymentPayboxView());
		this.setHeader({
			title: 'Paybox'
		});
	},

	showPaymentPaypal: function() {
		console.log('CheckoutController, showPaymentPaypal');

		this.navigationController.showContent(new PaymentPaypalView());
		this.setHeader({
			title: 'Paypal'
		});
	},

	showPaymentCmcic: function() {
		console.log('CheckoutController, showPaymentCmcic');

		this.navigationController.showContent(new PaymentCmcicView());
		this.setHeader({
			title: 'CM-CIC Monetico Paiement'
		});
	},

	showPaymentAtos: function() {
		console.log('CheckoutController, showPaymentAtos');

		this.navigationController.showContent(new PaymentAtosView());
		this.setHeader({
			title: 'ATOS SIPS'
		});
	},

	showPaymentCyberplus: function() {
		console.log('CheckoutController, showPaymentCyberplus');

		this.navigationController.showContent(new PaymentCyberplusView());
		this.setHeader({
			title: 'Cyberplus Paiement'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CheckoutController(),
	appRoutes: {
		'checkout': 'showIndex',
		/*'checkout/orders': 'showIndex',
		'checkout/orders/:id': 'showOrder',
		'checkout/aborted': 'showAborted',
		'checkout/payments': 'showPayments',
		'checkout/payments/cheque': 'showPaymentCheque',
		'checkout/payments/transfer': 'showPaymentTransfer',
		'checkout/payments/paybox': 'showPaymentPaybox',
		'checkout/payments/paypal': 'showPaymentPaypal',
		'checkout/payments/cmcic': 'showPaymentCmcic',
		'checkout/payments/atos': 'showPaymentAtos',
		'checkout/payments/cyberplus': 'showPaymentCyberplus',
		'checkout/options': 'showOptions',
		'checkout/options/:id': 'showOption',
		'checkout/emails': 'showSettingsEmails',
		'checkout/settings': 'showSettings',
		'checkout/carriers': 'showCarriers',
		'checkout/carriers/shop': 'showCarrierShop',
		'checkout/carriers/laposte': 'showCarrierLaposte',
		'checkout/carriers/:id': 'showCarrier',
		'checkout/carriers/local/:id': 'showCarrierLocal'*/
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
