var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Site = require('./models/site');
var Theme = require('./models/theme');
var Contact = require('./models/contact');
var Medias = require('./models/medias');
var Ftp = require('./models/ftp');
var Meta = require('./models/meta');
var Countries = require('kiubi/models/countries');
var Domains = require('kiubi/models/domains');
var Https = require('./models/https');

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
	template: require('./templates/sidebarMenu.html'),
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

		var s = new Site();
		var t = new Theme();

		Backbone.$.when(
			s.fetch(),
			t.fetch()
		).done(function() {
			var view = new IndexView({
				site: s,
				theme: t
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Préférences Générales'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			}.bind(this));
		});
	},

	showContact: function() {

		var m = new Contact();
		m.fetch().done(function() {
			var view = new ContactView({
				model: m,
				countries: new Countries()
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Coordonnées du site Internet'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showHttps: function() {

		var m = new Https();
		m.fetch().done(function() {
			this.navigationController.showContent(new HttpsView({
				model: m
			}));
			this.setHeader({
				title: 'Certificat SSL/TLS et accès HTTPS'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showMedias: function() {

		var m = new Medias();
		var f = new Ftp();

		Backbone.$.when(m.fetch(), f.fetch()).done(function() {
			var view = new MediasView({
				model: m,
				ftp: f
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Paramètres de la médiathèque'
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
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
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}]);
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showDomains: function() {

		var view = new DomainsView({
			collection: new Domains()
		});
		this.navigationController.showContent(view);
		view.start();
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
		'prefs/contact': 'showContact',
		'prefs/https': 'showHttps',
		'prefs/medias': 'showMedias',
		'prefs/meta': 'showMeta',
		'prefs/domains': 'showDomains',
		'prefs/users': 'showUsers',
		'prefs/users/:id': 'showUser',
		'prefs/shortcut': 'showShortcut'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
