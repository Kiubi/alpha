// for bootstrap
global.jQuery = require('jquery');
require('bootstrap');
global.__ = require('./utils/translate').translate;

// Chargement de la configuration
var Cfg = require('./config');

/**
 * Service Provider
 */
var ServiceProvider = require('./utils/provider');
var SP = new ServiceProvider();
SP.registerConfig(Cfg);

var User = require('kiubi/core/models/user');
var Session = require('kiubi/core/models/session');
var keypressContainer = require('keypress.js');
var keyListener = new keypressContainer.keypress.Listener();
SP.registerKeyListener(keyListener);

var NotificationCenter = require('./utils/notificationCenter');
if (Cfg.get('notificationSocket')) {
	SP.registerNotificationCenter(new NotificationCenter(Cfg.get('notificationSocket')));
}

/**
 * Application
 */
var KiubiApp = require('./utils/app');

var S = new Session({
	user: new User()
});

var App = new KiubiApp({
	session: S,
	serviceProvider: SP
});

var loader = require('./modules/loader.js');
new loader();

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
