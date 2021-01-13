var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Controller = require('kiubi/controller.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var NotFoundView = require('./views/notFound');
var DashboardView = require('./views/dashboard');
var HomeboardView = require('./views/homeboard');
var LoginView = require('./views/login');
var HelpView = require('./views/help');

var Stats = require('./models/stats');
var Report = require('./models/graphs');
var Live = require('./models/live');
var Cobranding = require('./models/cobranding');
var Contact = require('./models/contact');

var statsModel = new Stats();

var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/dashboard.sidebarMenu.html'),
	service: 'dashboard',
	behaviors: [TooltipBehavior],

	events: {
		'click a[data-role="dashboard"]': function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			window.open(Session.autologBackLink('/dashboard/'));
		}
	},

	initialize: function(options) {

		this.mergeOptions(options, ['stat']);

		if (this.stat) {
			this.listenTo(this.stat, 'sync', this.render);
		}
	},

	templateContext: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		return {
			show_catalog: Session.hasFeature('catalog') && Session.hasScope('site:catalog'),
			show_checkout: Session.hasFeature('checkout') && Session.hasScope('site:checkout'),
			pending_orders: this.stat.get('checkout') ? this.stat.get('checkout').pending_orders : null,
			stock_shortage_count: this.stat.get('catalog') ? this.stat.get('catalog').stock_shortage_count : null,
			unread_responses: this.stat.get('forms') ? this.stat.get('forms').unread_responses : null
		};
	}

});

var DefaultController = Controller.extend({

	sidebarMenuService: 'dashboard',
	sidebarMenu: SidebarMenuView,
	sidebarMenuOptions: {
		stat: statsModel
	},

	/*
	 *	Show NotFound Page
	 * @param {String} message
	 */
	notFound: function(message) {
		if (this.navigationController.getSidebarMenuService() === null) {
			this.navigationController.hideSidebarMenu();

			this.setHeader([{
					title: 'Kiubi',
					href: '/'
				},
				{
					title: 'Page non disponible'
				}
			]);
		}

		this.navigationController.showContent(new NotFoundView({
			message: message
		}));
	},

	/*
	 *	Login
	 */

	/**
	 * Preload login page
	 */
	loadLogin: function(queryString) {

		var qs = this.parseQueryString(queryString, {
			'code_site': null
		});

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (qs.code_site) {
			// Test current access to code_site
			Session.changeSite(qs.code_site).done(function() {
				// Redirect to Dashboard
				this.navigationController.navigate('/');
			}.bind(this)).fail(function() {
				// Show login form
				this.showLogin({
					code_site: qs.code_site,
					cobranding: new Cobranding(),
					Session: Session
				});
			}.bind(this));
		} else {
			this.showLogin({
				Session: Session
			});
		}
	},

	/**
	 * Show login page
	 */
	showLogin: function(options) {
		var view = new LoginView(options);

		this.listenTo(view, 'success:login', function() {
			this.navigationController.navigate('/'); // Go to Dashboard
			this.navigationController.hideModal();
		}.bind(this));

		this.navigationController.showModal(view);
	},

	/*
	 *	Dashboard
	 */

	chooseBoard: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		// Dashboard for non-admin, experts, or expired trial
		if (
			!Session.user.isAdmin() ||
			(Session.site.get('account').account_type === 'prestataire' && Session.site.get('account').account_level === 'expert') ||
			!Session.site.get('plan').is_trial
		) {
			this.navigationController.navigate('/dashboard');
		} else {
			this.navigationController.navigate('/homeboard');
		}

	},

	showDashboard: function() {
		this.showSidebarMenu();

		var view = new DashboardView({
			stats: statsModel,
			report: new Report(),
			live: new Live()
		});

		// Catch change site. User could already be in dashboard
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var that = this;
		view.listenTo(Session.site, 'change:site', function() {
			view.render();
			that.showSidebarMenu();
		});

		this.navigationController.showContent(view);

		this.setHeader([{
				title: 'Tableau de bord',
				href: '/'
			},
			{
				title: 'Bienvenue sur Kiubi'
			}
		], [{
			title: 'Voir le site',
			callback: 'openSite'
		}]);
	},

	showHomeboard: function() {
		this.showSidebarMenu();

		var view = new HomeboardView();

		this.navigationController.showContent(view);

		this.setHeader([{
				title: 'Tableau de bord',
				href: '/'
			},
			{
				title: 'Bienvenue sur Kiubi'
			}
		], [{
			title: 'Voir le site',
			callback: 'openSite'
		}]);
	},

	openSite: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		window.open(Session.autologLink());
	},

	/**
	 * Show login page
	 */
	showHelp: function() {

		this.showSidebarMenu();

		var view = new HelpView({
			model: new Contact()
		});

		this.navigationController.showContent(view);
		this.setHeader([{
				title: 'Tableau de bord',
				href: '/'
			},
			{
				title: 'Centre d\'aide'
			}
		]);
	}

});

module.exports = Marionette.AppRouter.extend({

	appRoutes: {
		"": "chooseBoard",
		"dashboard": "showDashboard",
		"homeboard": "showHomeboard",
		"login": "loadLogin",
		"help": "showHelp",
		"*notFound": "notFound"
	},

	/**
	 * Surcharge de la méthode Marionette.AppRouter.navigate
	 * Ajout de l'option preventPushState permettant de router l'application
	 * vers le path indiqué sans modifier l'URL du navigateur.
	 * @param {String} path
	 * @param {Object} options
	 */
	navigate: function(path, options) {
		options = (options || {
			trigger: true
		});

		var router = this;
		var application = this.application;
		var currentView = application.getRegion('contentRegion').currentView;

		var promise = currentView === undefined || !currentView.onBeforeDettach ||
			currentView.onBeforeDettach();

		if (promise) Backbone.$.when(promise).done(function() {
			application.trigger('navigate', path);
			if (options.preventPushState) {
				Backbone.history.loadUrl(path);
				return;
			}
			Marionette.AppRouter.prototype.navigate.apply(router, [path, options]);
		});
	},

	initialize: function(options) {
		this.mergeOptions(options, ['application']);
		this.controller = new DefaultController();

		var application = options.application;

		window.onpopstate = function() {
			application.trigger('navigate', window.location.pathname);
		};
	}

});
