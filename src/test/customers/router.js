var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller');

/* Models */
var Settings = require('./models/settings');
var Groups = require('./models/groups');

/* Views */
var IndexView = require('./views/index');
var CustomerView = require('./views/customer');
var CommentsBlogView = require('./views/comments.blog');
var CommentsCatalogView = require('./views/comments.catalog');
var OrdersView = require('./views/orders');
var DiscountView = require('./views/discount');
var FidelityView = require('./views/fidelity');
var SettingsView = require('./views/settings');
var GroupsView = require('./views/groups');
var GroupView = require('./views/group');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links');
var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'customers',
	behaviors: [ActiveLinksBehaviors]
});

var CustomersController = Controller.extend({

	sidebarMenuService: 'customers',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Membres',
		href: '/customers'
	}],

	showIndex: function() {
		console.log('CustomersController, showIndex');

		this.navigationController.showContent(new IndexView());
		this.setHeader({
			title: 'Tous les membres'
		});
	},

	showCustomer: function(id) {
		console.log('CustomersController, showCustomer', id);

		this.navigationController.showContent(new CustomerView());
		this.setHeader({
			title: 'Détail du membre ' + id
		});
	},

	showCommentsBlog: function(id) {
		console.log('CustomersController, showCommentsBlog', id);

		this.navigationController.showContent(new CommentsBlogView());
		this.setHeader({
			title: 'Commentaires du membre ' + id
		});
	},

	showCommentsCatalog: function(id) {
		console.log('CustomersController, showCommentsCatalog', id);

		this.navigationController.showContent(new CommentsCatalogView());
		this.setHeader({
			title: 'Évaluations du membre ' + id
		});
	},

	showOrders: function(id) {
		console.log('CustomersController, showOrders', id);

		this.navigationController.showContent(new OrdersView());
		this.setHeader({
			title: 'Commandes du membre ' + id
		});
	},

	showDiscount: function(id) {
		console.log('CustomersController, showDiscount', id);

		this.navigationController.showContent(new DiscountView());
		this.setHeader({
			title: 'Remise du membre ' + id
		});
	},

	showFidelity: function(id) {
		console.log('CustomersController, showFidelity', id);

		this.navigationController.showContent(new FidelityView());
		this.setHeader({
			title: 'Points de fidélité du membre ' + id
		});
	},

	/*
	 * Settings
	 */

	showSettings: function() {

		var m = new Settings();
		m.fetch().done(function() {

			var groups = new Groups();
			groups.fetch();
			var view = new SettingsView({
				model: m,
				groups: groups
			});

			this.navigationController.showContent(view);
			this.setHeader({
				title: 'Paramètres des membres'
			});
		}.bind(this)).fail(function() {
			this.notFound();
			this.setHeader({
				title: 'Paramètres introuvables'
			});
		}.bind(this));
	},

	showGroups: function() {
		console.log('CustomersController, showGroups');

		this.navigationController.showContent(new GroupsView());
		this.setHeader({
			title: 'Extranet'
		});
	},

	showGroup: function(id) {
		console.log('CustomersController, showGroup', id);

		this.navigationController.showContent(new GroupView());
		this.setHeader({
			title: 'Détail du groupe extranet ' + id
		});
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new CustomersController(),
	appRoutes: {
		'test/customers': 'showIndex',
		'test/customers/settings': 'showSettings',
		'test/customers/groups': 'showGroups',
		'test/customers/groups/:id': 'showGroup',
		'test/customers/:id': 'showCustomer',
		'test/customers/:id/comments/blog': 'showCommentsBlog',
		'test/customers/:id/comments/catalog': 'showCommentsCatalog',
		'test/customers/:id/comments/orders': 'showOrders',
		'test/customers/:id/discount': 'showDiscount',
		'test/customers/:id/fidelity': 'showFidelity'
	},

	onRoute: function(name, path, args) {
		this.controller.showSidebarMenu();
	}
});
