var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LoaderTpl = require('../templates/ui/loader.html');

module.exports = Marionette.View.extend({

	template: require('../templates/header.html'),

	/**
	 * Default breadcrum
	 */
	links: [{
		title: 'Kiubi',
		href: '/'
	}],

	/**
	 * Actions list
	 * 
	 * Usage :
	 * [{
	 *		title: 'Action #1',
	 *		callback: function(){}
	 *	}, {
	 *		title: 'Action #2',
	 *		callback: function(){}
	 *	}]
	 * 
	 */
	actions: null,
	lockActions: false,

	/**
	 * Tabs list
	 * 
	 * Usage :
	 * [{
	 *		title: 'Other action #1',
	 *		url: '/path1',
	 *		is_active: true	
	 *	}, {
	 *		title: 'Other action #2',
	 *		url: '/path2'
	 *		is_active: false	
	 *	}]
	 */
	tabs: null,

	ui: {
		'defaultAction': "button[data-role='default-action']",
		'otherActions': "[data-role='other-actions'] li"
	},

	events: {
		'click @ui.defaultAction': 'onDefaultAction',
		'click @ui.otherActions': 'onOtherAction'
	},

	/**
	 * Handler on default action
	 * 
	 * @param {Event} event
	 */
	onDefaultAction: function(event) {
		if (!this.getOption('actions').length ||
			!this.getOption('actions')[0].callback) {
			return;
		}
		this.onAction(this.getOption('actions')[0].callback);
	},

	/**
	 * Handler on other action. Use data-id to find which.
	 * 
	 * @param {Event} event
	 */
	onOtherAction: function(event) {
		var id = Backbone.$(event.currentTarget).data('id');
		if (!this.getOption('actions') ||
			id >= this.getOption('actions').length ||
			!this.getOption('actions')[id].callback) {
			return;
		}
		this.onAction(this.getOption('actions')[id].callback);
	},

	/**
	 * Généric handler with callback support
	 * 
	 * @param callback
	 */
	onAction: function(callback) {
		if (this.lockActions) return;
		this.lockActions = true;
		var promise = callback();
		if (!promise) {
			this.lockActions = false;
			return;
		}

		var btn = this.getUI('defaultAction');
		var view = this;
		var old = btn.text();
		btn.html(LoaderTpl());
		btn.addClass('btn-load');

		promise.always(function() {
			btn.removeClass('btn-load');
			btn.text(old);
			view.lockActions = false;
		});
	},

	/**
	 * Expose links and actions for template
	 */
	templateContext: function() {
		return {
			links: this.getOption('links'),
			actions: this.getOption('actions'),
			tabs: this.getOption('tabs')
		};
	},

	/**
	 * Set breadcrum
	 *
	 * @param {Array} links 
	 */
	setBreadCrum: function(links) {
		this.links = links;
	},

	/**
	 * Set default and others actions
	 * 
	 * @param {Array} actions
	 */
	setActions: function(actions) {
		this.actions = actions;
	},

	/**
	 * Set tabs
	 *
	 * @param {Array} tabs
	 */
	setTabs: function(tabs) {
		this.tabs = tabs;
	}

});
