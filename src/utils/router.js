var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

// API borrowed from Marionette.Object
const ObjectAPI = [
	//'triggerMethod',
	//'normalizeMethods',
	'_setOptions',
	'mergeOptions',
	'getOption',
	//'bindEvents',
	//'unbindEvents'
];

const ClassOptions = [
	'appRoutes',
	'controller'
];

var AppRouter = Backbone.Router.extend({
	constructor: function constructor(options) {
		this._setOptions(options);

		this.mergeOptions(options, ClassOptions);

		Backbone.Router.apply(this, arguments);

		var appRoutes = this.appRoutes;
		var controller = this._getController();
		this.processAppRoutes(controller, appRoutes);
	},


	// Similar to route method on a Backbone Router but
	// method is called on the controller
	appRoute: function appRoute(route, methodName) {
		var controller = this._getController();
		this._addAppRoute(controller, route, methodName);
		return this;
	},


	// Internal method to process the `appRoutes` for the
	// router, and turn them in to routes that trigger the
	// specified method on the specified `controller`.
	processAppRoutes: function processAppRoutes(controller, appRoutes) {
		var _this = this;

		if (!appRoutes) {
			return this;
		}

		var routeNames = _.keys(appRoutes).reverse(); // Backbone requires reverted order of routes

		_.each(routeNames, function(route) {
			_this._addAppRoute(controller, route, appRoutes[route]);
		});

		return this;
	},
	_getController: function _getController() {
		return this.controller;
	},
	_addAppRoute: function _addAppRoute(controller, route, methodName) {

		var method = controller[methodName];

		if (!method) {
			throw new Marionette.Error('Method "' + methodName + '" was not found on the controller');
		}

		// Will call onRoute before routing which can cancel routing
		var callback;
		if (_.isFunction(this.onRoute)) {
			callback = function() {
				if (this.onRoute(methodName) === false) {
					return;
				}
				method.apply(controller, arguments);
			}.bind(this);
		} else {
			callback = _.bind(method, controller);
		}

		this.route(route, methodName, callback);
	}

});

_.extend(AppRouter.prototype, _.pick(Marionette.Object.prototype, ObjectAPI));

module.exports = AppRouter;
