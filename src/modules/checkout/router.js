var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');
var ControllerChannel = Backbone.Radio.channel('controller');

/* Models */
var Checkout = require('./models/checkout');
var Orders = require('./models/orders');
var Aborted = require('./models/aborted');
var Settings = require('./models/settings');
var Options = require('./models/options');
var Taxes = require('kiubi/modules/catalog/models/taxes');
var Carriers = require('./models/carriers');
var CarriersCountries = require('./models/carriers.countries');
var CarriersZones = require('./models/carriers.zones');
var Countries = require('kiubi/core/models/countries');
var Search = require('kiubi/core/models/geo.search');
var Payments = require('./models/payments');
var Customers = require('kiubi/modules/customers/models/customers');

/* Views */
var OrdersView = require('./views/orders');
var OrderView = require('./views/order');
var AbortedView = require('./views/aborted');
var PaymentsView = require('./views/payments');
var PaymentView = require('./views/payment');
var OptionsView = require('./views/options');
var OptionView = require('./views/option');
var OptionAddModalView = require('./views/modal.option.add');
var SettingsView = require('./views/settings');
var SettingsEmailsView = require('./views/settings.emails');
var CarriersView = require('./views/carriers');
var CarrierView = require('./views/carrier');

/* Actions */
function getCarriersAction(options) {

	options = options || {};
	var actions = [];

	actions = actions.concat(
		[{
			title: 'Ajouter un transporteur',
			callback: ['actionNewCarrier', 'tranchespoids']
		}, {
			title: 'Ajouter un transporteur local',
			callback: ['actionNewCarrier', 'local']
		}]
	);

	var Session = Backbone.Radio.channel('app').request('ctx:session');
	if (Session.hasFeature('multi_pickup')) {
		actions.push({
			title: 'Ajouter un retrait en magasin',
			callback: ['actionNewCarrier', 'magasin']
		});
	}

	/*if (options.duplicateCarrier) {
		actions.push({
			title: 'Dupliquer le transporteur',
			callback: ['actionDuplicateCarrier', options.duplicateCarrier] // carrier_id
		});
	}*/

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

function getOrderAction(options) {

	options = options || {};
	var actions = [];

	if (options.form) {
		actions.push({
			title: 'Version imprimable',
			callback: ['actionOpenURL', options.form]
		});
	}

	if (options.xls) {
		actions.push({
			title: 'Exporter pour Excel',
			callback: ['actionOpenURL', options.xls]
		});
	}

	if (options.coliship) {
		actions.push({
			title: 'Exporter pour Coliship',
			callback: ['actionOpenURL', options.coliship]
		});
	}

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

	return actions;
}

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
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
	},

	onRefreshOrders: function() {
		this.overview.fetch().done(function() {
			this.render();
		}.bind(this));
	}
});

var CheckoutController = Controller.extend({

	sidebarMenuService: 'checkout',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Commandes',
		href: '/checkout'
	}],

	redirectToPending: function(queryString) {
		this.navigationController.navigate('/checkout/orders?status=pending');
	},

	showOrders: function(queryString) {
		var qs = this.parseQueryString(queryString, {
			'status': null,
			'term': null
		});

		if (!qs.status) {
			this.navigationController.navigate('/checkout/orders?status=pending');
			return;
		}

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var view = new OrdersView({
			collection: new Orders(),
			carriers: new Carriers(),
			customers: new Customers(),
			payments: new Payments(),
			filters: qs,
			hasAccounting: Session.hasFeature('accounting')
		});
		this.navigationController.showContent(view);
		view.start();

		this.listenTo(view.collection, 'bulk', function(action) {
			this.triggerSidebarMenu('refresh:orders');
		});

		var title;
		switch (qs.status) {
			default:
				title = 'Toutes les commandes';
				break;
			case 'pending':
				title = 'À traiter';
				break;
			case 'processing':
				title = 'En cours';
				break;
			case 'processed':
				title = 'Traitées';
				break;
			case 'shipped':
				title = 'Expédiées';
				break;
			case 'cancelled':
				title = 'Annulées';
				break;
		}
		this.setHeader({
			title: title
		});
	},

	showOrder: function(id) {

		var c = new Orders();
		var m = new c.model({
			order_id: id
		});

		m.fetch({
			data: {
				extra_fields: 'activity,price_label'
			}
		}).done(function() {

			var view = new OrderView({
				model: m
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Commande #' + m.get('reference')
			}, getOrderAction({
				xls: m.get('download').xls ? m.get('download').xls : null,
				coliship: m.get('download').coliship ? m.get('download').coliship : null,
				form: m.get('download').form ? m.get('download').form : null
			}));
		}.bind(this)).fail(this.failHandler('Commande introuvable'));
	},

	showAborted: function() {
		var view = new AbortedView({
			collection: new Aborted()
		});
		this.navigationController.showContent(view);
		view.start();

		this.setHeader({
			title: 'Commandes abondonnées'
		});
	},

	/*
	 * Payments
	 */

	showPayments: function() {
		var view = new PaymentsView({
			collection: new Payments()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Modes de paiement'
		});
	},

	showPayment: function(id) {
		var m = new Payments().add({
			payment_id: id
		});

		m.fetch().done(function() {

			// Not supported in this app version
			if (!m.isSupported()) {
				this.notFound();
				this.setHeader({
					title: 'Mode de paiement non supportée'
				});
				return;
			}

			var view = new PaymentView({
				model: m
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum([{
						title: 'Modes de paiement',
						href: '/checkout/payments'
					}, {
						title: m.get('name')
					}], true);
				}
			}.bind(this));
			this.navigationController.showContent(view);
			this.setHeader([{
				title: 'Modes de paiement',
				href: '/checkout/payments'
			}, {
				title: m.get('name')
			}], [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(this.failHandler('Mode de paiement introuvable'));
	},

	/*
	 * Options
	 */

	showOptions: function() {

		var view = new OptionsView({
			collection: new Options()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Options à la commande'
		}, [{
			title: 'Ajouter une option',
			callback: 'showOptionAdd'
		}]);
	},

	showOption: function(id) {

		var m = new Options().add({
			option_id: id
		});
		var taxes = new Taxes();

		Backbone.$.when(taxes.fetch(), m.fetch()).done(function() {

			// Not supported in this app version
			if (!m.isSupported()) {
				this.notFound();
				this.setHeader({
					title: 'Option non supportée'
				});
				return;
			}

			var view = new OptionView({
				model: m,
				taxes: taxes
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum([{
						title: 'Options',
						href: '/checkout/options'
					}, {
						title: m.get('name')
					}], true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/checkout/options');
			});
			this.navigationController.showContent(view);
			this.setHeader([{
				title: 'Options',
				href: '/checkout/options'
			}, {
				title: m.get('name')
			}], [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}, {
				title: 'Ajouter une option',
				callback: 'showOptionAdd'
			}]);
		}.bind(this)).fail(this.failHandler('Option introuvable'));
	},

	/*
	 * Modal
	 */

	showOptionAdd: function() {
		var contentView = new OptionAddModalView({});

		this.listenTo(contentView, 'select:type', this.actionNewOption);

		this.navigationController.showInModal(contentView, {
			title: 'Ajouter une option',
			modalClass: 'modal-pagetype-add'
		});
	},

	actionNewOption: function(data) {

		var m = new Options().add({
			type: data.type
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/checkout/options/' + m.get('option_id'));
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
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
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));
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
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(this.failHandler('Paramètres introuvable'));
	},

	/*
	 * Carriers
	 */

	showCarriers: function() {

		var view = new CarriersView({
			collection: new Carriers()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Transporteurs et frais de port'
		}, getCarriersAction());
	},

	showCarrier: function(id) {

		var m = new Carriers().add({
			carrier_id: id
		});
		var taxes = new Taxes();

		m.fetch().done(function() {

			// Not supported in this app version
			if (!m.isSupported()) {
				this.notFound();
				this.setHeader({
					title: 'Transporteur non supportée'
				});
				return;
			}

			var c = new CarriersCountries();
			c.carrier_id = id;
			var z = new CarriersZones();
			z.carrier_id = id;
			var view = new CarrierView({
				model: m,
				taxes: taxes,
				countries: new Countries(),
				carrierCountries: c,
				carrierZones: z,
				search: new Search()
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum([{
						title: 'Transporteurs',
						href: '/checkout/carriers'
					}, {
						title: m.get('name')
					}], true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/checkout/carriers');
			});
			this.navigationController.showContent(view);
			this.setHeader([{
				title: 'Transporteurs',
				href: '/checkout/carriers'
			}, {
				title: m.get('name')
			}], getCarriersAction({
				addSave: true
			}));
		}.bind(this)).fail(this.failHandler('Transporteur introuvable'));
	},

	actionNewCarrier: function(type) {
		var m = new Carriers().add({
			type: type,
			is_enabled: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/checkout/carriers/' + m.get('carrier_id'));
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CheckoutController(),
	appRoutes: {
		'checkout': 'redirectToPending',
		'checkout/orders': 'showOrders',
		'checkout/orders/:id': 'showOrder',
		'checkout/aborted': 'showAborted',
		'checkout/payments': 'showPayments',
		'checkout/payments/:id': 'showPayment',
		'checkout/options': 'showOptions',
		'checkout/options/:id': 'showOption',
		'checkout/emails': 'showSettingsEmails',
		'checkout/settings': 'showSettings',
		'checkout/carriers': 'showCarriers',
		'checkout/carriers/:id': 'showCarrier'
	},

	onRoute: function(name, path, args) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:checkout') || !Session.hasFeature('checkout')) {
			this.controller.navigationController.navigate('/');
			return;
		}

		this.controller.showSidebarMenu();
	}
});
