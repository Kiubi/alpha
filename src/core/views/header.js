var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');

var ControllerChannel = Backbone.Radio.channel('controller');

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

	navigation: null,

	ui: {
		'defaultAction': "button[data-role='default-action']",
		'otherActions': "[data-role='other-actions'] li"
	},

	events: {
		'click @ui.defaultAction': 'onActionEvent',
		'click @ui.otherActions': 'onActionEvent'
	},

	initialize: function() {
		this.listenTo(ControllerChannel, 'modified:content', _.debounce(this.onModifiedContent, 300));
		this.listenTo(ControllerChannel, 'saved:content', this.onSavedContent);

		this.navigation = null;
	},

	onModifiedContent: function(event) {

		var refresh = false;

		_.each(this.actions, function(action, index) {
			if (action.activateOnEvent && action.activateOnEvent == 'modified:content' && !action.isEnabled) {
				action.isEnabled = true;
				refresh = true;
			}
			if (action.bubbleOnEvent && action.bubbleOnEvent == 'modified:content' && !action.isOnTop) {
				action.isOnTop = true;
				refresh = true;
			}
		}.bind(this));

		if (refresh) {
			this.render();
		}
	},

	onSavedContent: function(event) {

		var refresh = false;

		_.each(this.actions, function(action, index) {
			if (action.activateOnEvent && action.activateOnEvent == 'modified:content' && action.isEnabled) {
				action.isEnabled = false;
				refresh = true;
			}
			if (action.bubbleOnEvent && action.bubbleOnEvent == 'modified:content' && action.isOnTop) {
				action.isOnTop = false;
				refresh = true;
			}
		}.bind(this));

		if (refresh) {
			this.render();
		}
	},

	/**
	 * Handler on other action. Use data-id to find which.
	 *
	 * @param {Event} event
	 */
	onActionEvent: function(event) {
		var id = Backbone.$(event.currentTarget).data('id');
		var action = _.findWhere(this.getOption('actions'), {
			index: id
		});
		if (!action || !action.callback || !action.isEnabled) {
			return;
		}
		this.onAction(action.callback);
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

		var sortedActions = [];

		if (this.getOption('actions') && this.getOption('actions').length > 0) {
			sortedActions = sortedActions.concat(
				_.filter(this.getOption('actions'), function(action) {
					return action.isOnTop;
				}),
				_.filter(this.getOption('actions'), function(action) {
					return !action.isOnTop;
				})
			);
		}

		return {
			links: this.getOption('links'),
			actions: sortedActions,
			tabs: this.getOption('tabs'),
			navigation: this.navigation
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
		_.each(actions, function(action, index) {
			action.isEnabled = !(action.activateOnEvent);
			action.isOnTop = false;
			action.index = index;
		});

		this.actions = actions;
	},

	/**
	 * Set tabs
	 *
	 * @param {Array} tabs
	 */
	setTabs: function(tabs) {
		this.tabs = tabs;
	},

	/**
	 * Set navigation
	 *
	 * @param {Object} navigation
	 */
	setNavigation: function(navigation) {
		this.navigation = navigation;
	}

});
