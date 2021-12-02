var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

var Forms = require('./models/forms');
var Fields = require('./models/fields');
var Responses = require('./models/responses');

var FormsView = require('./views/forms');
var InboxView = require('./views/inbox');
var FormView = require('./views/form');
var SettingsView = require('./views/settings');
var GdprView = require('./views/gdpr');

var SidebarMenuView = require('./views/sidebarMenu.js');

/* Tabs  */
function HeaderTabsForm(form_id) {
	return [{
		title: 'Formulaire',
		url: '/forms/' + form_id,
		icon: 'md-forms-detail'
	}, {
		title: 'Données personnelles',
		url: '/forms/' + form_id + '/gdpr',
		icon: 'md-forms-gdpr'
	}, {
		title: 'Paramètres',
		url: '/forms/' + form_id + '/settings',
		icon: 'md-forms-settings'
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
			'is_read': null,
			'r': null
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
		}.bind(this)).fail(function(error) {
			this.navigationController.showErrorModal(error);
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
				collection: fields
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
				title: 'Dupliquer le formulaire',
				callback: ['actionDuplicateForm', id] // form_id
			}, {
				title: 'Enregistrer',
				callback: 'actionSave',
				activateOnEvent: 'modified:content',
				bubbleOnEvent: 'modified:content'
			}], HeaderTabsForm(id));
		}.bind(this)).fail(this.failHandler('Formulaire introuvable'));
	},

	actionDuplicateForm: function(form_id) {

		var c = new Forms();
		var m = new c.model({
			form_id: form_id
		});

		var navigationController = this.navigationController;

		return m.fetch().then(
			function() {
				m.duplicate({
					name: 'Copie de ' + m.get('name')
				}).done(function(duplicate) {
					navigationController.showOverlay(300);
					navigationController.navigate('/forms/' + duplicate.get('form_id'));
				}).fail(function(error) {
					navigationController.showErrorModal(error);
				});
			},
			function(error) {
				navigationController.showErrorModal(error);
			}
		);
	},

	showGdpr: function(id) {
		var c = new Forms();
		var m = new c.model({
			form_id: id
		});

		m.fetch().done(function() {
			var view = new GdprView({
				model: m
			});

			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('name')
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsForm(id));
		}.bind(this)).fail(this.failHandler('Formulaire introuvable'));
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
		}.bind(this)).fail(this.failHandler('Formulaire introuvable'));
	}

});

module.exports = Router.extend({
	controller: new FormsController(),
	appRoutes: {
		'forms/inbox': 'showInbox',
		'forms': 'showForms',
		'forms/:id': 'showForm',
		'forms/:id/settings': 'showSettings',
		'forms/:id/gdpr': 'showGdpr'
	},

	onRoute: function(name) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:modules')) {
			this.controller.navigationController.navigate('/');
			return false;
		}

		this.controller.showSidebarMenu();
	}
});
