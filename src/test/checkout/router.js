var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller');

/* Models */
var Checkout = require('./models/checkout');
var Settings = require('./models/settings');

/* Views */
var IndexView = require('./views/index');
var OrderView = require('./views/order');
var AbortedView = require('./views/aborted');
var PaymentsView = require('./views/payments');
var OptionsView = require('./views/options');
var OptionView = require('./views/option');
var SettingsView = require('./views/settings');
var SettingsEmailsView = require('./views/settings.emails');
var CarriersView = require('./views/carriers');
var CarrierView = require('./views/carrier');
var CarriersShopView = require('./views/carriers.shop');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
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

	showCarriersShop: function() {
		console.log('CheckoutController, showCarriersShop');

		this.navigationController.showContent(new CarriersShopView());
		this.setHeader({
			title: 'Retrait en boutique'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CheckoutController(),
	appRoutes: {
		'test/checkout': 'showIndex',
		'test/checkout/orders': 'showIndex',
		'test/checkout/orders/:id': 'showOrder',
		'test/checkout/aborted': 'showAborted',
		'test/checkout/payments': 'showPayments',
		'test/checkout/options': 'showOptions',
		'test/checkout/options/:id': 'showOption',
		'test/checkout/emails': 'showSettingsEmails',
		'test/checkout/settings': 'showSettings',
		'test/checkout/carriers': 'showCarriers',
		'test/checkout/carriers/shop': 'showCarriersShop',
		'test/checkout/carriers/:id': 'showCarrier'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
