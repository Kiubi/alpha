var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

/**
 * Helper to set actions and bind them to the controler
 *
 * @param  {Array} actions
 * @param  {Marionette.Object} controller
 */
function setHeaderActions(actions, controller) {

	// Bind others callback
	if (actions && actions.length) {

		_(actions).each(function(item) {
			if (item.callback && !_.isFunction(item.callback)) {
				if (_.isArray(item.callback)) {
					item.callback = controller[item.callback[0]].bind(controller, item.callback[
						1]);
				} else {
					item.callback = controller[item.callback].bind(controller);
				}
			}
		});
	}

	controller.navigationController.setHeaderActions(actions);
}



/**
 * Helper to set tabs
 *
 * @param  {Object} tabs Page
 * @param  {Marionette.Object} controller
 */
function setHeaderTabs(tabs, controller) {

	if (tabs) {
		_(tabs).each(function(tab) {
			tab.is_active = tab.url == document.location.pathname;
		});
	}

	controller.navigationController.setHeaderTabs(tabs);
}


/**
 *  Controller
 */
module.exports = Marionette.Object.extend({

	sidebarMenuService: null,
	sidebarMenu: null,
	sidebarMenuEvents: {},
	sidebarMenuBuffer: [],

	baseBreadcrum: [],

	initialize: function(options) {
		this.navigationController = Backbone.Radio.channel('app').request(
			'ctx:navigationController');
	},

	/**
	 * Update sidebar menu if needed & bind events
	 *
	 * @returns {Marionette.View}
	 */
	showSidebarMenu: function() {
		if (!this.sidebarMenu) return;

		if (this.navigationController.getSidebarMenuDetail() != null && this.navigationController.getSidebarMenuService() ==
			this.sidebarMenuService) {
			return;
		}
		var view = new this.sidebarMenu();
		_.each(this.sidebarMenuEvents, function(value, key) {
			this.listenTo(view, key, this[value]);
		}, this);

		// Empty buffer
		_.each(this.sidebarMenuBuffer, function(event) {
			view.triggerMethod(event.event, event.params);
		}, this);
		this.sidebarMenuBuffer = [];

		this.navigationController.showSidebarMenuDetail(view);

	},

	/**
	 * Trigger an event on the SidebarMenu View
	 *
	 * @param event
	 * @param params
	 */
	triggerSidebarMenu: function(event, params) {

		var view = this.navigationController.getSidebarMenuDetail();
		if (!view || this.sidebarMenuService != view.service) {
			// sidebar not loaded or still previous sidebar => buffer
			this.sidebarMenuBuffer.push({
				event: event,
				params: params
			});
			return;
		}
		view.triggerMethod(event, params);
	},

	/**
	 * Helper to show a "Not Found" Page
	 *
	 */
	notFound: function() {
		this.navigationController.notFound();
	},

	/**
	 * Helper to set breadcrum and actions binded to the controler
	 * 
	 * @param {Object|Array} breadcrum
	 * @param {Object} actions
	 * @param {Array} tabs
	 */
	setHeader: function(breadcrum, actions, tabs) {
		this.setBreadCrum(breadcrum);
		setHeaderActions(actions, this);
		setHeaderTabs(tabs, this);
		this.navigationController.refreshHeader();
	},

	/**
	 * Helper to set breadcrum with a common root
	 *
	 * @param  {Object|Array} page Page
	 * @param  {Boolean} refresh Rerender header
	 */
	setBreadCrum: function(page, refresh) {
		var bc = [];
		var i = this.baseBreadcrum.length;
		while (i--) {
			bc[i] = this.baseBreadcrum[i];
		}
		if (_.isArray(page)) {
			bc = bc.concat(page);
		} else {
			bc.push(page);
		}
		this.navigationController.setBreadCrum(bc);
		if (refresh) this.navigationController.refreshHeader();
	}

});
