var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Contact = require('./models/contact');
var Medias = require('./models/medias');
var Ftp = require('./models/ftp');
var Meta = require('./models/meta');

/* Views */
var IndexView = require('./views/index');
var ContactView = require('./views/contact');
var HttpsView = require('./views/https');
var MediasView = require('./views/medias');
var MetaView = require('./views/meta');
var DomainsView = require('./views/domains');
var UsersView = require('./views/users');
var UserView = require('./views/user');
var ShortcutView = require('./views/shortcut');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('kiubi/templates/sidebarMenu.empty.html'),
	service: 'prefs',
	behaviors: [ActiveLinksBehaviors]
});

var PrefsController = Controller.extend({

	sidebarMenuService: 'prefs',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Préférences',
		href: '/prefs'
	}],

	showIndex: function() {

		this.navigationController.underConstruction();
		return;

		console.log('PrefsController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Préférences Générales'
		});
	},

	showContact: function() {
		console.log('PrefsController, showContact');

		var m = new Contact();
		m.fetch().done(function() {
			var view = new ContactView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Coordonnées du site Internet'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showHttps: function() {
		console.log('PrefsController, showHttps');

		this.navigationController.showContent(new HttpsView());
		this.setHeader({
			title: 'Certificat SSL/TLS et accès HTTPS'
		});
	},

	showMedias: function() {
		var m = new Medias();
		var f = new Ftp();
		m.fetch().
		then(function() {
			return f.fetch();
		}).
		done(function() {
			var view = new MediasView({
				ftp: f
			});
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Paramètres de la médiathèque'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showMeta: function() {
		var m = new Meta();
		m.fetch().done(function() {
			var view = new MetaView();
			view.model = m;
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Balises metas par défaut'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showDomains: function() {
		console.log('PrefsController, showDomains');

		this.navigationController.showContent(new DomainsView());
		this.setHeader({
			title: 'Noms de domaine'
		});
	},

	showUsers: function() {
		console.log('PrefsController, showUsers');

		this.navigationController.showContent(new UsersView());
		this.setHeader({
			title: 'Comptes utilisateurs'
		});
	},

	showUser: function(id) {
		console.log('CustomersController, showUser', id);

		this.navigationController.showContent(new UserView());
		this.setHeader({
			title: 'Détail du membre ' + id
		});
	},

	showShortcut: function() {
		console.log('CustomersController, showShortcut');

		this.navigationController.showContent(new ShortcutView());
		this.setHeader({
			title: 'Raccourcis clavier'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new PrefsController(),
	appRoutes: {
		'prefs': 'showIndex',
		/*'prefs/contact': 'showContact',
		'prefs/https': 'showHttps',
		'prefs/medias': 'showMedias',
		'prefs/meta': 'showMeta',
		'prefs/domains': 'showDomains',
		'prefs/users': 'showUsers',
		'prefs/users/:id': 'showUser',
		'prefs/shortcut': 'showShortcut'*/
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
