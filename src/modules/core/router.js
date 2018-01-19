var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Controller = require('kiubi/controller.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var NotFoundView = require('./views/notFound');
var UnderConstructionView = require('./views/underConstruction');
var DashboardView = require('./views/dashboard');
var LoginView = require('./views/login');

var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/dashboard.sidebarMenu.html'),
	service: 'dashboard',
	behaviors: [TooltipBehavior]
});

var DefaultController = Controller.extend({

	sidebarMenuService: 'dashboard',
	sidebarMenu: SidebarMenuView,

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
	 *	Show ComingSoon Page
	 */
	underConstruction: function() {
		this.navigationController.setBreadCrum([{
			title: 'Kiubi',
			href: '/'
		},
			{
				title: 'Page en construction'
			}
		]);
		this.navigationController.setHeaderActions(null);
		this.navigationController.setHeaderTabs(null);
		this.navigationController.refreshHeader();

		this.navigationController.showContent(new UnderConstructionView());
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

		var view = new DashboardView();

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
