var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'dashboard',
	behaviors: [TooltipBehavior],

	events: {
		'click a[data-role="dashboard"]': function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			window.open(Session.autologBackLink('/dashboard/'));
		}
	},

	initialize: function(options) {

		this.mergeOptions(options, ['stat']);

		if (this.stat) {
			this.listenTo(this.stat, 'sync', this.render);

			var notificationcenter = Backbone.Radio.channel('app').request('ctx:notificationCenter');
			if (notificationcenter) {
				this.listenTo(notificationcenter, 'notification:order notification:response', function() {
					this.stat.fetch();
				});
			}

		}
	},

	templateContext: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		return {
			show_catalog: Session.hasFeature('catalog') && Session.hasScope('site:catalog'),
			show_checkout: Session.hasFeature('checkout') && Session.hasScope('site:checkout'),
			pending_orders: this.stat.get('checkout') ? this.stat.get('checkout').pending_orders : null,
			stock_shortage_count: this.stat.get('catalog') ? this.stat.get('catalog').stock_shortage_count : null,
			unread_responses: this.stat.get('forms') ? this.stat.get('forms').unread_responses : null
		};
	}

});
