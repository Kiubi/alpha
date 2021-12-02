var Marionette = require('backbone.marionette');

module.exports = Marionette.Object.extend({

	channelName: 'app',

	radioRequests: {
		'ctx:app': 'getApp',
		'ctx:session': 'getSession',
		'ctx:config': 'getConfig',
		'ctx:navigationController': 'getNavigationController',
		'ctx:keyListener': 'getKeyListener',
		'ctx:notificationCenter': 'getNotificationCenter'
	},

	app: null,
	config: null,
	keyListener: null,
	notificationCenter: null,

	/**
	 * @param {Marionette.Application} app
	 */
	registerApp: function(app) {
		this.app = app;
	},

	/**
	 * @returns {App}
	 */
	getApp: function() {
		return this.app;
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
		return this.keyListener;
	},

	/**
	 * @param {NotificationCenter} notificationCenter
	 */
	registerNotificationCenter: function(notificationCenter) {
		this.notificationCenter = notificationCenter;
	},


	/**
	 * @returns {NotificationCenter}
	 */
	getNotificationCenter: function() {
		return this.notificationCenter;
	},

});
