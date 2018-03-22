var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

var Forms = require('./models/forms');
var Fields = require('./models/fields');
var Responses = require('./models/responses');

var FormsView = require('./views/forms');
var InboxView = require('./views/inbox');
var FormView = require('./views/form');
var SettingsView = require('./views/settings');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'forms',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {
		this.forms = new Forms();
		this.listenTo(this.forms, 'sync', this.render);
		this.forms.fetch();
	},

	templateContext: function() {
		var c = this.forms.reduce(function(memo, model) {
			return memo + model.get('replies_unread_count')
		}, 0);

		return {
			unread_count: c
		};
	}
});

/* Tabs  */
function HeaderTabsForm(form_id) {
	return [{
		title: 'Détail du formulaire',
		url: '/forms/' + form_id
	}, {
		title: 'Paramètres',
		url: '/forms/' + form_id + '/settings'
	}];
}

var FormsController = Controller.extend({

	sidebarMenuService: 'forms',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Dismoi',
		href: '/forms'
	}],

	showInbox: function(queryString) {

		var qs = this.parseQueryString(queryString, {
			'id': null,
			'u': null // [null,1] => all, only unread
		});

		var view = new InboxView({
			collection: new Responses(),
			forms: new Forms(),
			filters: qs
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Boite de réception'
		});
	},

	showForms: function() {

		var view = new FormsView({
			collection: new Forms()
		});
		this.navigationController.showContent(view);
		view.start();

		this.setHeader({
			title: 'Tous les formulaires'
		}, [{
			title: 'Ajouter un formulaire',
			callback: 'actionNewForm'
		}]);
	},

	actionNewForm: function() {

		var c = new Forms();
		var m = new c.model({
			name: 'Intitulé par défaut',
			is_visible: false
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/forms/' + m.get('form_id'));
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	showForm: function(id) {
		var c = new Forms();
		var m = new c.model({
			form_id: id
		});

		m.fetch().done(function() {
			var fields = new Fields();
			fields.form_id = id;
			fields.fetch();
			var view = new FormView({
				model: m,
				fields: fields
			});
			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum({
						title: model.get('name')
					}, true);
				}
			}.bind(this));
			this.listenTo(m, 'destroy', function() {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/forms');
			});
			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsForm(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Formulaire introuvable'
			});
		}.bind(this));
	},

	showSettings: function(id) {
		var c = new Forms();
		var m = new c.model({
			form_id: id
		});

		m.fetch().done(function() {
			var view = new SettingsView({
				model: m
			});

			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsForm(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Formulaire introuvable'
			});
		}.bind(this));
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new FormsController(),
	appRoutes: {
		'forms/inbox': 'showInbox',
		'forms': 'showForms',
		'forms/:id': 'showForm',
		'forms/:id/settings': 'showSettings'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
