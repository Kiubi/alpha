var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');

/* Models */
var Settings = require('./models/settings');
var Group = require('./models/group');
var Groups = require('./models/groups');
var GrpDiscount = require('./models/group_discounts');
var Customer = require('./models/customer');
var Customers = require('./models/customers');
var BlogComments = require('kiubi/modules/blog/models/comments');
var CatalogComments = require('kiubi/modules/catalog/models/comments');
var Fidelity = require('./models/fidelity');
var Discounts = require('./models/discounts');
var Page = require('kiubi/modules/cms/models/page');

/* Views */
var CustomersView = require('./views/customers');
var CustomerView = require('./views/customer');
var BlogCommentsView = require('kiubi/modules/blog/views/comments');
var CatalogCommentsView = require('kiubi/modules/catalog/views/comments');
var OrdersView = require('./views/orders');
var DiscountView = require('./views/discount');
var FidelityView = require('./views/fidelity');
var SettingsView = require('./views/settings');
var GroupsView = require('./views/groups');
var GroupView = require('./views/group');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'customers',
	behaviors: [ActiveLinksBehaviors]
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
	return [{
		title: 'Détail du membre',
		url: '/customers/' + customer_id
	}, {
		title: 'Commentaires',
		url: '/customers/' + customer_id + '/blog_comments'
	}, {
		title: 'Évaluations',
		url: '/customers/' + customer_id + '/catalog_comments'
	}, {
		title: 'Commandes',
		url: '/customers/' + customer_id + '/orders'
	}, {
		title: 'Remises',
		url: '/customers/' + customer_id + '/discount'
	}, {
		title: 'Fidelité',
		url: '/customers/' + customer_id + '/fidelity'
	}];
}

var CustomersController = Controller.extend({

	sidebarMenuService: 'customers',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Membres',
		href: '/customers'
	}],

	showCustomers: function() {
		var view = new CustomersView({
			collection: new Customers()
		});
		this.navigationController.showContent(view);
		view.start();
		this.setHeader({
			title: 'Tous les membres'
		});
	},

	showCustomer: function(id) {
		var m = new Customer({
			customer_id: id
		});

		var groups = new Groups();

		Backbone.$.when(m.fetch(), groups.fetch()).done(function() {
			var view = new CustomerView({
				model: m,
				groups: groups
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
		var m = new Customer({
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
		var m = new Customer({
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
		console.log('CustomersController, showOrders', id);

		this.navigationController.showContent(new OrdersView());
		this.setHeader({
			title: 'Commandes du membre ' + id
		});
	},

	showDiscount: function(id) {
		var c = new Customer({
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
		var m = new Customer({
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

		var m = new Settings();
		var g = new Groups();

		Backbone.$.when(
			m.fetch(),
			g.fetch()
		).done(function() {
			var view = new SettingsView({
				model: m,
				groups: g
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
		var discount = new GrpDiscount();
		discount.group_id = id;

		Backbone.$.when(m.fetch(), discount.fetch()).done(function() {
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
		this.controller.showSidebarMenu();
	}
});
