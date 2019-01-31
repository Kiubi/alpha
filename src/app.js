var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

// for bootstrap
global.jQuery = require('jquery');
require('bootstrap');
global.__ = require('./utils/translate').translate;

// Marionette inspector
if (window.__agent) {
	window.__agent.start(Backbone, Marionette);
}

// Chargement de la configuration
var Cfg = require('./config');

/**
 * Service Provider
 */
var ServiceProvider = Marionette.Object.extend({

	channelName: 'app',

	radioRequests: {
		'ctx:session': 'getSession',
		'ctx:config': 'getConfig',
		'ctx:navigationController': 'getNavigationController',
		'ctx:keyListener': 'getKeyListener'
	},

	app: null,
	config: null,
	keyListener: null,

	/**
	 * @param {Marionette.Application} app
	 */
	registerApp: function(app) {
		this.app = app;
	},

	/**
	 * @param {Backbone.Model} config
	 */
	registerConfig: function(config) {
		this.config = config;
	},

	/**
	 * @returns {Backbone.Model}
	 */
	getConfig: function() {
		return this.config;
	},

	/**
	 * @returns {Backbone.Model}
	 */
	getSession: function() {
		return this.app.session;
	},

	/**
	 * @returns {Marionette.Object}
	 */
	getNavigationController: function() {
		return this.app.navigationController;
	},


	/**
	 * @param {keypress} keyListener
	 */
	registerKeyListener: function(keyListener) {
		this.keyListener = keyListener;
	},


	/**
	 * @returns {keypress}
	 */
	getKeyListener: function() {
		return keyListener;
	}

});
var SP = new ServiceProvider();
SP.registerConfig(Cfg);

var LayoutView = require('kiubi/core/views/layout');
var AppRouter = require('kiubi/core/router');
var User = require('kiubi/core/models/user');
var Session = require('kiubi/core/models/session');
var NavigationController = require('./navigation');
var api = require('./utils/api.client');
var keypressContainer = require('keypress.js');
var keyListener = new keypressContainer.keypress.Listener();
SP.registerKeyListener(keyListener);

/**
 * Application
 */
var KiubiApp = Marionette.Application.extend({

	region: 'body',

	initialize: function(options) {
		console.info('Initialize Application');

		this.mergeOptions(options, ['session']);

		SP.registerApp(this);

		Backbone.ajax = function() {
			// this makes Backbone use our client
			return api.ajax.apply(api, arguments);
		};

		var application = this;

		var layout = new LayoutView();
		layout.render();

		this.navigationController = new NavigationController({
			layoutView: layout,
			application: this
		});

		this.router = new AppRouter({
			application: this
		});

		layout.on('navigate', function(path, options) {
			application.navigationController.navigate(path);
		});

		this.listenTo(this.session, 'logout', function() {
			this.navigationController.navigate('/login');
		}.bind(this));
	},

	/**
	 * Callback de demarage de l'application, le module authentication
	 * substitue temporairement ce callback le temps de vérifier le token
	 * éventuellement disponible en cookie. En cas de token invalide, ou
	 * d'absence de token, le module modifie l'url demandée par /login et
	 * lance l'application
	 */
	onStart: function(options) {
		console.info('Starting Application');

		this.navigationController.showSidebar();
		this.navigationController.showSidebarMenu();
		this.navigationController.showHeader();

		if (!Backbone.history.started) {
			Backbone.history.start({
				pushState: true
			});
		}
		Backbone.Radio.channel('navigation').trigger('change:url', {
			path: window.location.pathname + window.location.search
		});

		// Register KeyCombo
		var keyListener = SP.getKeyListener();
		keyListener.register_combo({
			"keys": "meta s",
			"is_exclusive": true,
			"on_keydown": function() {
				var ControllerChannel = Backbone.Radio.channel('controller');
				ControllerChannel.trigger('meta:s:shortcut');
			}
		});
	},

	/**
	 * Helper permettant de naviguer au sein de l'application
	 *
	 * @param {String} path
	 * @param {object} options
	 */
	navigate: function(path, options) {
		this.router.navigate(path, _.extend({
			trigger: true
		}, options));
		Backbone.Radio.channel('navigation').trigger('change:url', {
			path: path
		});
	}
});

var S = new Session({
	user: new User()
});

var App = new KiubiApp({
	session: S
});

var CMSRoute = require('./modules/cms/router');
new CMSRoute();

var BlogRoute = require('./modules/blog/router');
new BlogRoute();

var CatalogRoute = require('./modules/catalog/router');
new CatalogRoute();

var CheckoutRoute = require('./modules/checkout/router');
new CheckoutRoute();

var AppearanceRoute = require('./modules/appearance/router');
new AppearanceRoute();

var MediaRoute = require('./modules/media/router');
new MediaRoute();

var CustomersRoute = require('./modules/customers/router');
new CustomersRoute();

var FormsRoute = require('./modules/forms/router');
new FormsRoute();

var ModulesRoute = require('./modules/modules/router');
new ModulesRoute();

var PrefsRoute = require('./modules/prefs/router');
new PrefsRoute();

var ThemesRoute = require('./modules/themes/router');
new ThemesRoute();

// Tracker GA
if (Cfg.get('ga_tracker')) {
	var script = document.createElement('script');
	script.async = 1;
	script.src = 'https://www.googletagmanager.com/gtag/js?id=' + Cfg.get('ga_tracker');
	var insert = document.getElementsByTagName('script')[0];
	insert.parentNode.insertBefore(script, insert);

	window.dataLayer = window.dataLayer || [];

	function gtag() {
		dataLayer.push(arguments);
	}
	gtag('js', new Date());

	gtag('config', Cfg.get('ga_tracker'));
	App.on('navigate', function(path) {
		gtag('config', Cfg.get('ga_tracker'), {
			'page_path': path
		});
	});
}

S.start()
	.done(function() {
		console.log('Already authenticate');
		// Chargement normal
	})
	.fail(function() {
		// Affiche le formulaire de login
		if (document.location.pathname == "/login") return;
		history.pushState({}, document.title, "/login");
	})
	.always(function() {
		App.start({});
	});
