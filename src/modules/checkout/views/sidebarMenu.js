var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

var Checkout = require('../models/checkout');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'checkout',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.overview = new Checkout();

		var notificationcenter = Backbone.Radio.channel('app').request('ctx:notificationCenter');
		if (notificationcenter) {
			this.listenTo(notificationcenter, 'notification:order', function() {
				this.fetchAndRender();
			});
		}

		this.fetchAndRender();
	},

	fetchAndRender: function() {
		Backbone.$.when(
			this.overview.fetch()
		).done(function() {
			this.render();
		}.bind(this)).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	templateContext: function() {
		return {
			overview: this.overview.toJSON()
		};
	},

	onRefreshOrders: function() {
		this.overview.fetch().done(function() {
			this.render();
		}.bind(this));
	}
});
