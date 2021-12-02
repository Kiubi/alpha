var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var api = require('kiubi/utils/api.client');
var NavigationController = require('kiubi/navigation');

var LayoutView = require('kiubi/core/views/layout');
var AppRouter = require('kiubi/core/router');

module.exports = Marionette.Application.extend({

	region: 'body',

	serviceProvider: null,
	session: null,
	notificationCenter: null,

	initialize: function(options) {
		console.info('Initialize Application');

		this.mergeOptions(options, ['session', 'serviceProvider']);

		this.serviceProvider.registerApp(this);

		Backbone.ajax = function() {
			// this makes Backbone use our client
			return api.ajax.apply(api, arguments);
		};

		var application = this;
		var notificationCenter = this.serviceProvider.getNotificationCenter();

		var layout = new LayoutView({
			notificationCollection: notificationCenter ? notificationCenter.collection : null
		});
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

		if (notificationCenter) {
			this.listenTo(this.session.site, 'change:site', function() {
				notificationCenter.register(this.session.storage.getItem('AccesToken'), this.session.site.get('code_site')); // FIXME more elegant
			}.bind(this));
			this.listenTo(this.session, 'logout', function() {
				notificationCenter.close();
			}.bind(this));
		}
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
		var keyListener = this.serviceProvider.getKeyListener();
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
