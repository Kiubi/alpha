var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

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
	sidebarMenuOptions: {},
	sidebarMenuBuffer: [],

	baseBreadcrum: [],
	context: null,

	initialize: function(options) {
		this.navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		this.context = {};
	},

	/**
	 * Set context param
	 * 
	 * @param {String} name
	 * @param {*} value
	 */
	addContext: function(name, value) {
		this.context[name] = value;
	},

	/**
	 * Get context param
	 * 
	 * @param {String} name
	 * @returns {*}
	 */
	getContext: function(name) {
		return this.context[name];
	},

	/**
	 * Update sidebar menu if needed & bind events
	 *
	 * @returns {Marionette.View}
	 */
	showSidebarMenu: function() {
		if (!this.sidebarMenu) return;

		if (this.navigationController.getSidebarMenuDetail() != null &&
			this.navigationController.getSidebarMenuService() == this.sidebarMenuService) {
			return;
		}
		var view = new this.sidebarMenu(this.sidebarMenuOptions);
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
	 * @param {String} message
	 */
	notFound: function(message) {
		this.navigationController.notFound(message);
	},

	/**
	 * Helper to set breadcrum and actions binded to the controler
	 * 
	 * @param {Object|Array} breadcrum
	 * @param {Array} actions
	 * @param {Array} tabs
	 * @param {Object} navigation
	 */
	setHeader: function(breadcrum, actions, tabs, navigation) {
		this.setBreadCrum(breadcrum);
		this.setHeaderActions(actions);
		setHeaderTabs(tabs, this);
		this.setHeaderNavigation(navigation);
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
	},

	/**
	 * Helper to set actions and bind them to the controler
	 *
	 * @param  {Array} actions
	 * @param  {Boolean} refresh Rerender header
	 */
	setHeaderActions: function(actions, refresh) {
		var controller = this;

		// Bind others callback
		if (actions && actions.length) {

			_(actions).each(function(item) {
				if (item.callback && !_.isFunction(item.callback)) {
					if (_.isArray(item.callback)) {
						item.callback = this[item.callback[0]].bind(this, item.callback[1]);
					} else {
						item.callback = this[item.callback].bind(this);
					}
				}
			}.bind(this));
		}

		this.navigationController.setHeaderActions(actions);
		if (refresh) this.navigationController.refreshHeader();

	},

	/**
	 * Helper to set navigation and bind them to the controler
	 *
	 * @param  {Object} navigation
	 * @param  {Boolean} refresh Rerender header
	 */
	setHeaderNavigation: function(navigation, refresh) {
		this.navigationController.setHeaderNavigation(navigation);
		if (refresh) this.navigationController.refreshHeader();

	},

	/**
	 * Handle common API errors
	 *
	 * @param {String} defaultError
	 * @param {String} defaultMessage
	 * @returns {function}
	 */
	failHandler: function(defaultError, defaultMessage) {
		return function() {

			// Handle all others like 404
			this.notFound(defaultMessage);
			this.setHeader({
				title: defaultError
			});

		}.bind(this);
	},

	/**
	 * Proxy to content View method onSave
	 *
	 * @returns {null|Promise}
	 */
	actionSave: function() {

		var contentView = this.navigationController.getContent();
		if (!contentView || !contentView.onSave) return null;

		var container = {};
		contentView.triggerMethod('simpleForm:save', container);
		if (container.promise) return container.promise;
	},

	/**
	 * Open url in new tab/window
	 *
	 * @param {String} url
	 */
	actionOpenURL: function(url) {
		window.open(url);
	},

	/**
	 * Parse a query string. Only expected params are returned.
	 * 
	 * @param {String} queryString
	 * @param {Object} expected
	 * @returns {Object}
	 */
	parseQueryString: function(queryString, expected) {
		if (!_.isString(queryString)) return expected;
		queryString = queryString.substring(queryString.indexOf('?') + 1);
		var queryParts = decodeURI(queryString).split(/&/g);
		_.each(queryParts, function(val) {
			var parts = val.split('=');
			if (parts.length >= 1 && expected.hasOwnProperty(parts[0])) {
				expected[parts[0]] = (parts.length == 2) ? parts[1] : null;
			}
		});
		return expected;
	}

});
