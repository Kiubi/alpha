var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var NavigationChannel = Backbone.Radio.channel('navigation');

var SidebarView = require('kiubi/core/views/sidebar');
var SidebarMenuView = require('kiubi/core/views/sidebarMenu');
var HeaderView = require('kiubi/core/views/header');
var ModalView = require('kiubi/core/views/ui/modal');

var OverlayView = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/loader.html'),
	tagName: 'div',
	className: 'overlay'
});

var Link = Backbone.Model.extend({
	defaults: {
		name: "",
		path: '/',
		className: '',
		type: "main",
		is_active: false,
		scope: null,
		feature: null,
		is_enabled: true
	}
});

/**
 *
 * @param {Array} breadcrum
 */
function updateTitle(breadcrum) {
	if (breadcrum.length == 0) {
		document.title = 'Kiubi';
		return;
	}

	var page = breadcrum[breadcrum.length - 1].title;

	var Session = Backbone.Radio.channel('app').request('ctx:session');
	var site = (!Session) ? 'Kiubi' : Session.site.get('name');

	document.title = site + ' • ' + page;
}

/**
 * Navigation Controller
 */
module.exports = Marionette.Object.extend({

	layoutView: null,
	application: null,
	lockErrorModal: false,

	initialize: function(options) {
		this.mergeOptions(options, ['layoutView', 'application']);

		this.listenTo(this.application.session.site, 'change:site', function() {
			var header = this.layoutView.getChildView('header');
			if (header) updateTitle(header.links);
		}.bind(this));

		this.listenTo(NavigationChannel, 'critical:error', function(error, meta) {
			this.showErrorModal(error);
		}.bind(this));

		this.listenTo(NavigationChannel, 'expired:login', function(error, meta) {
			this.navigate('/login');
		}.bind(this));
	},


	/*
	 * HEADER
	 */


	/**
	 * Set breadcrum
	 *
	 * @param  {Array} links
	 */
	setBreadCrum: function(links) {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').setBreadCrum(links);

		updateTitle(links);
	},

	/**
	 * Set actions
	 *
	 * @param  {Array} actions
	 */
	setHeaderActions: function(actions) {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').setActions(actions);
	},

	/**
	 * Set navigation
	 *
	 * @param  {Object} navigation
	 */
	setHeaderNavigation: function(navigation) {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').setNavigation(navigation);
	},

	/**
	 * Set tabs
	 *
	 * @param  {Array} tabs
	 */
	setHeaderTabs: function(tabs) {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').setTabs(tabs);
	},

	/**
	 * Rerender Header
	 */
	refreshHeader: function() {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').render();
	},

	/**
	 * Show Header
	 */
	showHeader: function() {
		this.layoutView.showChildView('header', new HeaderView());
	},


	/*
	 * SIDEBAR
	 */


	/**
	 * Show Sidebar
	 */
	showSidebar: function() {

		var links = new Backbone.Collection();
		links.model = Link;
		links.add([{
				name: "Tableau de bord",
				path: '/',
				className: 'md-home',
				is_active: true
			}, {
				name: "Site Web",
				path: "/cms",
				className: 'md-website',
				scope: 'site:cms'
			}, {
				name: "Blog",
				path: "/blog",
				className: 'md-blog',
				scope: 'site:blog'
			}, {
				name: "Catalogue",
				path: "/catalog",
				className: 'md-product',
				scope: 'site:catalog',
				feature: 'catalog'
			}, {
				name: "Commandes",
				path: "/checkout",
				className: 'md-order',
				scope: 'site:checkout',
				feature: 'checkout'
			}, {
				name: "Membres",
				path: "/customers",
				className: 'md-member',
				scope: 'site:account'
			}, {
				name: "Modules",
				path: "/modules",
				className: 'md-extension'
			}, {
				name: "Mises en page",
				path: "/appearance",
				className: 'md-layout',
				scope: 'site:layout'
			}, {
				name: "Thèmes graphiques",
				path: "/themes",
				className: 'md-theme',
				scope: 'site:theme'
			},
			// Tools
			{
				name: "Médiathèque",
				path: "/media",
				className: 'md-media',
				type: "tools"
			},
			{
				name: "Préférences",
				path: "/prefs",
				className: 'md-settings',
				type: "tools",
				scope: 'site:pref'
			}
		]);

		this.layoutView.showChildView('sidebar', new SidebarView({
			session: this.application.session,
			collection: links
		}));
	},


	/*
	 * SIDEBAR MENU
	 */


	/**
	 * Empty & close Sidebar Menu
	 */
	hideSidebarMenu: function() {
		this.layoutView.lockMenu();
		this.layoutView.getRegion('sidebarMenu').empty();
	},

	/**
	 * Show the Sidebar Menu
	 *
	 */
	showSidebarMenu: function() {
		this.layoutView.showChildView('sidebarMenu', new SidebarMenuView({
			model: this.application.session.site
		}));
	},

	/**
	 * Show the new Sidebar Menu Detail
	 *
	 * @param {Marionette.View} view
	 */
	showSidebarMenuDetail: function(view) {
		if (!this.layoutView.getChildView('sidebarMenu')) {
			this.showSidebarMenu();
		}
		var sidebarMenuView = this.layoutView.getChildView('sidebarMenu');
		sidebarMenuView.showChildView('detail', view);
		sidebarMenuView.service = view.service;
	},

	/**
	 * Get Sidebar Menu Detail
	 *
	 * @return {Marionette.View}
	 */
	getSidebarMenuDetail: function() {
		if (!this.layoutView.getChildView('sidebarMenu')) {
			return null;
		}
		var sidebarMenuView = this.layoutView.getChildView('sidebarMenu');
		return sidebarMenuView.getChildView('detail');
	},

	/**
	 * Return service of the current Sidebar Menu
	 *
	 * @returns {null|String}
	 */
	getSidebarMenuService: function() {
		if (!this.layoutView.getRegion('sidebarMenu') || !this.layoutView.getChildView('sidebarMenu')) return null;
		return this.layoutView.getChildView('sidebarMenu').service || null;
	},


	/*
	 * CONTENT
	 */


	/**
	 * Show a view in content
	 * @param {Marionette.View} view
	 */
	showContent: function(view) {
		try {
			this.layoutView.showChildView('content', view);
		} catch (error) {
			console.error(error);
		}
	},

	/**
	 * Get the content view
	 * @returns {Marionette.View}
	 */
	getContent: function() {
		return this.layoutView.getChildView('content');
	},


	/*
	 * MODAL
	 */

	/**
	 * Show an arbitrary modal
	 *
	 * @param {Marionette.View} view View
	 * @param {int} duration milliseconds
	 */
	showModal: function(view, duration) {
		this.layoutView.showChildView('modal', view);
		if (duration) setTimeout(this.hideModal.bind(this), duration);
	},

	/**
	 * Show a view embed in a ModalView
	 *
	 * @param {Marionette.View} view View
	 * @param {Object} modalSettings MolalView settings
	 * 							- {String} title
	 * 							- {String} modalClass
	 * 							- {Object} action {title:{String}}
	 */
	showInModal: function(view, modalSettings) {
		var modalView = new ModalView(modalSettings);
		this.showModal(modalView);
		// Attach modalView to DOM before attaching the view
		modalView.showChildView('content', view);
	},

	/**
	 * Show an arbitrary modal
	 *
	 * @param {Object} error Error
	 * @param {int} duration milliseconds
	 */
	showErrorModal: function(error, duration) {

		if (this.lockErrorModal) return;
		this.lockErrorModal = true;

		var errorMsg;

		if (!_.isString(error)) {
			if (error.handled) return;
			errorMsg = error.message ? error.message : "Une erreur inattendue s'est produite";
		} else {
			errorMsg = error;
		}

		var modalView = new ModalView({
			title: 'Oups ! Une erreur est survenue.',
			modalClass: 'modal-danger'
		});
		this.showModal(modalView, duration);
		this.listenTo(modalView, 'destroy', function() {
			this.lockErrorModal = false;
		});

		// Attach modalView to DOM before attaching the view
		var view = Marionette.View.extend({
			template: _.template(errorMsg)
		});
		modalView.showChildView('content', new view());
	},

	/**
	 * Hide modal
	 */
	hideModal: function() {
		this.layoutView.getRegion('modal').empty();
	},

	/**
	 * Show overlay modal
	 *
	 * @param {int} duration milliseconds
	 */
	showOverlay: function(duration) {
		this.showModal(new OverlayView(), duration);
	},

	/*
	 * PROXY
	 */


	/**
	 * Proxy to application navigate
	 *
	 * @param {String} path
	 */
	navigate: function(path) {
		this.application.navigate(path);
		this.scrollTop('fast');
	},

	/**
	 * Call notfound handler on the default router
	 *
	 */
	notFound: function() {
		this.application.router.controller.notFound();
	},

	/**
	 *
	 */
	scrollTop: function(speed) {
		speed = speed || 'slow';
		Backbone.$('#content').animate({
			scrollTop: 0
		}, speed);
	}

});
