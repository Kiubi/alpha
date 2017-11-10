var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('../../controller');

var IndexView = require('./views/index');
var ResponsesView = require('./views/responses');
var FormView = require('./views/form');
var FormSettingsView = require('./views/form.settings');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'forms',
	behaviors: [ActiveLinksBehaviors]
});

var FormsController = Controller.extend({

	sidebarMenuService: 'forms',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Dismoi',
		href: '/forms'
	}],

	showIndex: function() {
		console.log('FormsController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les formulaires'
		});
	},

	showResponses: function() {
		console.log('FormsController, showResponses');

		this.navigationController.showContent(new ResponsesView());
		this.setHeader({
			title: 'Boite de réception'
		});
	},

	showForm: function(id) {
		console.log('FormsController, showForm', id);

		this.navigationController.showContent(new FormView());
		this.setHeader({
			title: 'Détail du formulaire ' + id
		});
	},

	showFormSettings: function(id) {
		console.log('FormsController, showFormSettings', id);

		this.navigationController.showContent(new FormSettingsView());
		this.setHeader({
			title: 'Paramètres du formulaire ' + id
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new FormsController(),
	appRoutes: {
		'forms': 'showIndex',
		'forms/responses': 'showResponses',
		'forms/:id': 'showForm',
		'forms/:id/settings': 'showFormSettings'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
