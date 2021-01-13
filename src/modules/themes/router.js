var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

/* Models */
var Ftp = require('../prefs/models/ftp');
var Themes = require('./models/themes');
var Conversion = require('./models/conversion');
var ImportTheme = require('kiubi/modules/modules/models/import.theme');

/* Views */
var ThemeView = require('./views/theme');
var CustomView = require('./views/custom');
var ImportView = require('./views/import');
var ConversionView = require('./views/conversion');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'themes',
	behaviors: [ActiveLinksBehaviors]
});

var ThemesController = Controller.extend({

	sidebarMenuService: 'themes',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Thèmes',
		href: '/themes'
	}],

	showTheme: function() {

		var f = new Ftp();
		var themes = new Themes();

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		Backbone.$.when(f.fetch(), themes.getCurrent()).done(function(ftp, theme) {
			var view = new ThemeView({
				ftp: f,
				themes: themes,
				current: theme,
				enableConversion: !Session.hasFeature('component'),
				enableExport: Session.hasFeature('theme_export'),
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Thème graphique'
			});
		}.bind(this)).fail(
			function(error, meta) {
				if (error.code === 4015) { // Theme invalide
					this.notFound(error.message);
					this.setHeader({
						title: 'Thème graphique'
					});
				} else {
					// Handle all others like 404
					this.notFound();
					this.setHeader({
						title: 'Thème graphique'
					});
				}
			}.bind(this)
		);
	},

	showCustom: function() {

		var themes = new Themes();
		themes.fetch().done(function() {
			this.navigationController.showContent(new CustomView({
				collection: themes
			}));

			this.listenTo(themes, 'create', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/themes');
			});

			this.setHeader({
				title: 'Passer en thème personnalisé'
			});
		}.bind(this)).fail(this.failHandler('Paramètres introuvables'));

	},

	showImport: function() {

		this.navigationController.showContent(new ImportView({
			model: new ImportTheme()
		}));
		this.setHeader({
			title: 'Importer un thème'
		});
	},

	showConversion: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (Session.hasFeature('component')) {
			this.navigationController.navigate('/');
			return;
		}

		this.navigationController.showContent(new ConversionView({
			model: new Conversion()
		}));
		this.setHeader({
			title: 'Analyse du thème'
		});
	}

});

module.exports = Router.extend({
	controller: new ThemesController(),
	appRoutes: {
		'themes': 'showTheme',
		'themes/custom': 'showCustom',
		'themes/import': 'showImport',
		'themes/conversion': 'showConversion'
	},

	onRoute: function(name) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:theme')) {
			this.controller.navigationController.navigate('/');
			return false;
		}

		this.controller.showSidebarMenu();
	}
});
