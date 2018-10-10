var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Settings = require('./models/settings');
var Group = require('./models/group');
var Groups = require('./models/groups');
var GrpDiscount = require('./models/group_discounts');
var Customers = require('./models/customers');
var BlogComments = require('kiubi/modules/blog/models/comments');
var CatalogComments = require('kiubi/modules/catalog/models/comments');
var Orders = require('kiubi/modules/checkout/models/orders');
var Fidelity = require('./models/fidelity');
var Discounts = require('./models/discounts');
var Page = require('kiubi/modules/cms/models/page');

/* Views */
var CustomersView = require('./views/customers');
var CustomerView = require('./views/customer');
var BlogCommentsView = require('kiubi/modules/blog/views/comments');
var CatalogCommentsView = require('kiubi/modules/catalog/views/comments');
var OrdersView = require('kiubi/modules/checkout/views/orders');
var DiscountView = require('./views/discount');
var FidelityView = require('./views/fidelity');
var SettingsView = require('./views/settings');
var GroupsView = require('./views/groups');
var GroupView = require('./views/group');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'customers',
	behaviors: [ActiveLinksBehaviors],

	templateContext: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			has_feature_extranet: Session.hasFeature('extranet')
		};
	}
});

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [];

	if (options.addGrp) {
		actions.push({
			title: 'Ajouter un groupe',
			callback: 'actionNewGroup'
		});
	}

	if (options.addSave) {

		var saveAction = {
			title: 'Enregistrer',
			callback: 'actionSave',
			activateOnEvent: 'modified:content',
			bubbleOnEvent: 'modified:content'
		};

		if (actions.length <= 1) {
			actions.push(saveAction);
		} else {
			actions.splice(1, 0, saveAction);
		}

	}

	return actions;
}

/* Tabs  */
function HeaderTabsCustomer(customer_id) {

	var Session = Backbone.Radio.channel('app').request('ctx:session');

	var tabs = [{
		title: 'Détail du membre',
		url: '/customers/' + customer_id
	}];

	if (Session.hasScope('site:blog')) {
		tabs.push({
			title: 'Commentaires',
			url: '/customers/' + customer_id + '/blog_comments'
		});
	}

	if (Session.hasFeature('catalog') && Session.hasScope('site:catalog')) {
		tabs.push({
			title: 'Évaluations',
			url: '/customers/' + customer_id + '/catalog_comments'
		});
	}

	if (Session.hasFeature('checkout') && Session.hasScope('site:checkout')) {
		tabs.push({
			title: 'Commandes',
			url: '/customers/' + customer_id + '/orders'
		});
		tabs.push({
			title: 'Remises',
			url: '/customers/' + customer_id + '/discount'
		});
	}

	if (Session.hasFeature('fidelity')) {
		tabs.push({
			title: 'Fidelité',
			url: '/customers/' + customer_id + '/fidelity'
		});
	}

	return tabs;
}

var CustomersController = Controller.extend({

	sidebarMenuService: 'customers',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Membres',
		href: '/customers'
	}],

	showCustomers: function(queryString) {

		var qs = this.parseQueryString(queryString, {
			'term': null
		});

		var view = new CustomersView({
			collection: new Customers(),
			filters: qs
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Tous les membres'
		});
	},

	showCustomer: function(id) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var m = new Customers().add({
			customer_id: id
		});

		var groups = new Groups();

		Backbone.$.when(
			m.fetch(),
			Session.hasFeature('extranet') ? groups.fetch() : Backbone.$.Deferred().resolve()
		).done(function() {
			var view = new CustomerView({
				model: m,
				groups: groups,
				enableExtranet: Session.hasFeature('extranet')
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('firstname') || model.hasChanged('lastname')) {
					this.setBreadCrum({
						title: m.get('firstname') + ' ' + m.get('lastname')
					}, true);
				}
			}.bind(this));

			this.listenTo(m, 'destroy', function(model) {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/customers');
			}.bind(this));

			this.navigationController.showContent(view);
			this.setHeader({
				title: m.get('firstname') + ' ' + m.get('lastname')
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	showBlogComments: function(id) {
		var m = new Customers().add({
			customer_id: id
		});

		m.fetch().done(function() {
			var c = new BlogComments();

			var view = new BlogCommentsView({
				collection: c
			});
			this.navigationController.showContent(view);
			view.start({
				customer_id: id
			});
			this.setHeader({
				title: m.get('firstname') + ' ' + m.get('lastname')
			}, null, HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	showCommentsCatalog: function(id) {
		var m = new Customers().add({
			customer_id: id
		});

		m.fetch().done(function() {
			var c = new CatalogComments();

			var view = new CatalogCommentsView({
				collection: c
			});
			this.navigationController.showContent(view);
			view.start({
				customer_id: id
			});
			this.setHeader({
				title: m.get('firstname') + ' ' + m.get('lastname')
			}, null, HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	showOrders: function(id) {
		var m = new Customers().add({
			customer_id: id
		});
		m.fetch().done(function() {
			var view = new OrdersView({
				collection: new Orders(),
				customer_id: id
			});
			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
				title: m.get('firstname') + ' ' + m.get('lastname')
			}, null, HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	showDiscount: function(id) {
		var c = new Customers().add({
			customer_id: id
		});
		var m = new Discounts();
		m.customer_id = id;

		Backbone.$.when(m.fetch(), c.fetch()).done(function() {
			var view = new DiscountView({
				model: m,
				customer: c
			});

			this.navigationController.showContent(view);
			this.setHeader({
				title: c.get('firstname') + ' ' + c.get('lastname')
			}, [{
				title: 'Enregistrer',
				callback: 'actionSave'
			}], HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	showFidelity: function(id) {
		var m = new Customers().add({
			customer_id: id
		});

		m.fetch().done(function() {
			var c = new Fidelity();
			c.customer_id = id;
			var view = new FidelityView({
				model: m,
				collection: c
			});

			this.navigationController.showContent(view);
			view.start();
			this.setHeader({
				title: m.get('firstname') + ' ' + m.get('lastname')
			}, null, HeaderTabsCustomer(id));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Membre introuvable'
			});
		}.bind(this));
	},

	/*
	 * Settings
	 */

	showSettings: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		var m = new Settings();
		var g = new Groups();

		Backbone.$.when(
			m.fetch(),
			Session.hasFeature('extranet') ? g.fetch() : Backbone.$.Deferred().resolve()
		).done(function() {
			var view = new SettingsView({
				model: m,
				groups: g,
				enableExtranet: Session.hasFeature('extranet')
			});

			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Paramètres des membres'
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

	/**
	 * Groups
	 */

	showGroups: function() {

		var view = new GroupsView({
			collection: new Groups()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Extranet'
		}, getHeadersAction({
			addGrp: true
		}));
	},

	showGroup: function(id) {

		var c = new Groups();
		var m = new c.model({
			group_id: id
		});

		var promise;
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (Session.hasFeature('checkout') && Session.hasScope('site:checkout')) {
			var discount;
			discount = new GrpDiscount();
			discount.group_id = id;
			promise = discount.fetch()
		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		Backbone.$.when(m.fetch(), promise).done(function() {
			var view = new GroupView({
				model: m,
				page: new Page(),
				discount: discount
			});

			this.listenTo(m, 'change', function(model) {
				if (model.hasChanged('name')) {
					this.setBreadCrum([{
						title: 'Extranet',
						href: '/customers/groups'
					}, {
						title: m.get('name')
					}], true);
				}
			}.bind(this));

			this.listenTo(m, 'destroy', function(model) {
				this.navigationController.showOverlay(300);
				this.navigationController.navigate('/customers/groups');
			}.bind(this));

			this.navigationController.showContent(view);
			this.setHeader([{
				title: 'Extranet',
				href: '/customers/groups'
			}, {
				title: m.get('name')
			}], getHeadersAction({
				addGrp: true,
				addSave: true
			}));
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader([{
				title: 'Extranet',
				href: '/customers/groups'
			}, {
				title: 'Groupe extranet introuvable'
			}]);
		}.bind(this));
	},

	actionNewGroup: function() {

		var m = new Group({
			name: 'Intitulé par défaut'
		});

		return m.save().done(function() {
			this.navigationController.showOverlay(300);
			this.navigationController.navigate('/customers/groups/' + m.get('group_id'));
		}.bind(this)).fail(function(xhr) {
			this.navigationController.showErrorModal(xhr);
		}.bind(this));
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CustomersController(),
	appRoutes: {
		'customers': 'showCustomers',
		'customers/settings': 'showSettings',
		'customers/groups': 'showGroups',
		'customers/groups/:id': 'showGroup',
		'customers/:id': 'showCustomer',
		'customers/:id/blog_comments': 'showBlogComments',
		'customers/:id/catalog_comments': 'showCommentsCatalog',
		'customers/:id/orders': 'showOrders',
		'customers/:id/discount': 'showDiscount',
		'customers/:id/fidelity': 'showFidelity'
	},

	onRoute: function(name, path, args) {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:account')) {
			this.controller.navigationController.navigate('/');
			return;
		}

		if (name == 'showFidelity' && !Session.hasFeature('fidelity')) {
			this.controller.navigationController.navigate('/');
			return;
		}

		if ((name == 'showGroups' || name == 'showGroup') && !Session.hasFeature('extranet')) {
			this.controller.navigationController.navigate('/');
			return;
		}

		this.controller.showSidebarMenu();
	}
});
