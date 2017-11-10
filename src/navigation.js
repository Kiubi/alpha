var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var SidebarView = require('./views/sidebar');
var SidebarMenuView = require('./views/sidebarMenu');
var HeaderView = require('./views/header');
var ModalView = require('./views/ui/modal');

var OverlayView = Marionette.View.extend({
	template: require('./templates/ui/loader.html'),
	tagName: 'div',
	className: 'overlay'
});

/**
 * Navigation Controller
 */
module.exports = Marionette.Object.extend({

	layoutView: null,
	application: null,

	initialize: function(options) {
		this.mergeOptions(options, ['layoutView', 'application']);
	},


	/*
	 * HEADER
	 */


	/**
	 * Set breadcrum
	 *
	 * @param  {array} links
	 */
	setBreadCrum: function(links) {
		if (!this.layoutView.getChildView('header')) return;

		this.layoutView.getChildView('header').setBreadCrum(links);
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
		links.add([{
				name: "Dashboard",
				path: '/',
				className: 'md-home',
				type: "main",
				is_active: true
			}, {
				name: "Site Web",
				path: "/cms",
				className: 'md-website',
				type: "main",
				is_active: false
			}, {
				name: "Blog",
				path: "/blog",
				className: 'md-blog',
				type: "main",
				is_active: false
			}, {
				name: "Catalogue",
				path: "/catalog",
				className: 'md-product',
				type: "main",
				is_active: false
			}, {
				name: "Commandes",
				path: "/checkout",
				className: 'md-order',
				type: "main",
				is_active: false
			}, {
				name: "Membres",
				path: "/customers",
				className: 'md-member',
				type: "main",
				is_active: false
			}, {
				name: "Modules",
				path: "/modules",
				className: 'md-extension',
				type: "main",
				is_active: false
			}, {
				name: "Mises en page",
				path: "/appearance",
				className: 'md-layout',
				type: "main",
				is_active: false
			}, {
				name: "Thèmes",
				path: "#",
				className: 'md-theme',
				type: "main",
				is_active: false
			},
			// Tools
			{
				name: "Médiathèque",
				path: "/media",
				className: 'md-media',
				type: "tools",
				is_active: false
			},
			{
				name: "Préférences",
				path: "/prefs",
				className: 'md-settings',
				type: "tools",
				is_active: false
			},
			{
				name: "Aide & support",
				path: "#",
				className: 'md-help',
				type: "tools",
				is_active: false
			}
		]);

		this.layoutView.showChildView('sidebar', new SidebarView({
			model: this.application.session.user,
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
		var view = new SidebarMenuView();
		view.model = this.application.session.site;
		view.listenTo(view.model, 'change:site', view.render);

		this.layoutView.showChildView('sidebarMenu', view);
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
		this.layoutView.showChildView('content', view);
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
	 * @param {String|XHR} xhr Error message
	 * @param {int} duration milliseconds
	 */
	showErrorModal: function(xhr, duration) {
		var modalView = new ModalView({
			title: 'Oups ! Une erreur est survenue.',
			modalClass: 'modal-danger'
		});
		this.showModal(modalView, duration);

		if (!_.isString(xhr)) {
			xhr = xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message ? xhr.responseJSON.error.message :
				"Une erreur inattendue s'est produite";
		}

		// Attach modalView to DOM before attaching the view
		var view = Marionette.View.extend({
			template: _.template(xhr)
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


	underConstruction: function() {
		this.application.router.controller.underConstruction();
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
