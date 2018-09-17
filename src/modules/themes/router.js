var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Ftp = require('../prefs/models/ftp');
var Themes = require('./models/themes');

/* Views */
var ThemeView = require('./views/theme');
var CustomView = require('./views/custom');
var ImportView = require('./views/import');

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

		Backbone.$.when(f.fetch(), themes.getCurrent()).done(function(ftp, theme) {
			var view = new ThemeView({
				ftp: f,
				themes: themes,
				current: theme
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Thème graphique'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
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
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));

	},

	showImport: function() {

		this.navigationController.showContent(new ImportView());
		this.setHeader({
			title: 'Importer un thème'
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new ThemesController(),
	appRoutes: {
		'themes': 'showTheme',
		'themes/custom': 'showCustom',
		'themes/import': 'showImport'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
