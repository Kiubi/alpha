var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Controller = require('kiubi/controller.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var NotFoundView = require('./views/notFound');
var DashboardView = require('./views/dashboard');
var LoginView = require('./views/login');

var Stats = require('./models/stats');
var Report = require('./models/report');
var Logs = require('./models/logs');
var Live = require('./models/live');

var statsModel = new Stats();

var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/dashboard.sidebarMenu.html'),
	service: 'dashboard',
	behaviors: [TooltipBehavior],

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
			unread_responses: this.stat.get('forms') ? this.stat.get('forms').unread_responses : null,
			domain: 'https://' + Session.site.get('backoffice')
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
	 */
	notFound: function() {
		if (this.navigationController.getSidebarMenuService() == null) {
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

		this.navigationController.showContent(new NotFoundView());
	},

	/*
	 *	Login
	 */


	/**
	 * Show login page
	 */
	showLogin: function() {
		var view = new LoginView();
		this.listenTo(view, 'form-login:submit', this.actionLogin);
		this.navigationController.showModal(view);
	},

	/**
	 * Authentification on login page
	 *
	 * @param {Object} params
	 * @param {Marionette.View} loginView
	 */
	actionLogin: function(params, loginView) {
		var Session = Backbone.Radio.channel('app').request('ctx:session');

		Session.authenticate(params.login, params.password)
			.done(function() {
				this.navigationController.navigate('/'); // Go to Dashboard
				this.navigationController.hideModal();
			}.bind(this))
			.fail(function(error) {
				loginView.showError(error);
			});
	},

	/*
	 *	Dashboard
	 */
	dashboard: function() {
		this.showSidebarMenu();

		var view = new DashboardView({
			stats: statsModel,
			report: new Report(),
			activity: new Logs(),
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
		]);
	}
});

module.exports = Marionette.AppRouter.extend({

	appRoutes: {
		"": "dashboard",
		"login": "showLogin",
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
