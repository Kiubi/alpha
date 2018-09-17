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
var Gdpr = require('./models/gdpr');
var L10n = require('./models/l10n');

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
var GdprView = require('./views/gdpr');
var L10nView = require('./views/l10n');
var L10nImportView = require('./views/l10n.import');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'prefs',
	behaviors: [ActiveLinksBehaviors]
});

/* Tabs  */
function HeaderTabsL10n() {

	return [{
		title: 'Traductions',
		url: '/prefs/l10n'
	}, {
		title: 'Import',
		url: '/prefs/l10n/import'
	}];
}

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
	},

	showGdpr: function() {
		var m = new Gdpr();
		m.fetch().done(function() {
			var view = new GdprView({
				model: m
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Protection des données personnelles'
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

	showL10n: function() {

		var view = new L10nView({
			collection: new L10n()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Traductions'
		}, [{
			title: 'Supprimer les traductions',
			callback: 'actionClearL10n'
		}], HeaderTabsL10n());
	},

	showL10nImport: function() {
		this.navigationController.showContent(new L10nImportView({
			model: new L10n()
		}));
		this.setHeader({
			title: 'Import de traductions'
		}, null, HeaderTabsL10n());
	},

	actionClearL10n: function() {
		var c = new L10n();

		this.navigationController.showOverlay();

		c.clearAll().then(function() {
			var view = this.navigationController.getContent();
			if (view && view.start) {
				view.start();
			}
			this.navigationController.hideModal();

		}.bind(this), function() {
			this.navigationController.showErrorModal('Erreur lors de la suppresion des traductions', 2000);
		}.bind(this));
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
		'prefs/shortcut': 'showShortcut',
		'prefs/gdpr': 'showGdpr',
		'prefs/l10n': 'showL10n',
		'prefs/l10n/import': 'showL10nImport'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
