var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var moment = require('moment');
var _ = require('underscore');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var Session; // Must wait because this model is loaded BEFORE session start
var Dashboard = require('../models/dashboard');

/* Widgets */

var GraphView = require('./dashboard/graph.js');
var OrdersView = require('./dashboard/orders.js');
var FormsView = require('./dashboard/forms.js');
var FunnelView = require('./dashboard/funnel.js');
var SourcesView = require('./dashboard/sources.js');
var ProductsView = require('./dashboard/products.js');
var SearchView = require('./dashboard/search.js');
var MapView = require('./dashboard/map.js');
var ActivitiesView = require('./dashboard/activities.js');

var EmptyWidgetView = Marionette.View.extend({
	template: _.template('')
});

function fieldsNeeded(widgets) {

	var fields = ['visits'];

	if (widgets.findWhere({
			type: 'orders'
		})) fields.push('orders');
	if (widgets.findWhere({
			type: 'funnel'
		})) fields.push('funnel');
	if (widgets.findWhere({
			type: 'search'
		})) fields.push('search');
	if (widgets.findWhere({
			type: 'products'
		})) fields.push('products');
	if (widgets.findWhere({
			type: 'map'
		})) fields.push('origins');
	if (widgets.findWhere({
			type: 'sources'
		})) fields.push('referer');

	return fields;
}

var WidgetGridView = Marionette.CollectionView.extend({
	className: 'row',
	childView: function(item) {

		switch (item.get('type')) {
			case 'orders':
				return OrdersView;
			case 'forms':
				return FormsView;
			case 'funnel':
				return FunnelView;
			case 'sources':
				return SourcesView;
			case 'products':
				return ProductsView;
			case 'search':
				return SearchView;
			case 'map':
				return MapView;
			case 'activities':
				return ActivitiesView;
		}

		return EmptyWidgetView; // should not happens
	}
});

var MessagesView = Marionette.View.extend({
	template: _.template(
		'<div>' +
		'<% _.each(messages, function(message){ %><div class="alert alert-warning d-flex justify-content-between align-items-center p-3" role="alert"><span><%= message %></span></div><% }) %>' +
		'</div>'),

	initialize: function(options) {
		this.mergeOptions(options, ['messages']);
	},

	templateContext: function() {
		return {
			messages: this.messages
		};
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/dashboard.html'),

	behaviors: [TooltipBehavior],

	regions: {
		messages: {
			el: "div[data-role='messages']",
			replaceElement: true
		},
		graph: {
			el: "article[data-role='graph']",
			replaceElement: true
		},
		widgets: {
			el: "div[data-role='widgets']",
			replaceElement: true
		}
	},

	events: {
		'click a[data-role="subscription"]': function() {
			window.open(Session.autologBackLink('/comptes/formules/crediter.html'));
		},
		'click a[data-role="plan"]': function() {
			window.open(Session.autologAccountLink('/sites/formule.html?code_site=' + Session.site.get('code_site')));
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['stats', 'report', 'live']);

		// Must wait because this module is loaded BEFORE session start
		Session = Backbone.Radio.channel('app').request('ctx:session');

		this.dashboardPrefs = new Dashboard();

		this.live.fetch();
	},

	templateContext: function() {

		var plan = Session.site.get('plan');
		var interval_closing, interval_trial;
		if (plan && plan.closing_date) {
			// +1 => site is closed at the end of the closing day
			interval_closing = Math.ceil(moment(plan.closing_date, 'YYYY-MM-DD').diff(moment(), 'days', true)) + 1;
		}
		if (plan && plan.endtrial_date) {
			// +1 => trail is ended at the end of end trial day
			interval_trial = Math.ceil(moment(plan.endtrial_date, 'YYYY-MM-DD').diff(moment(), 'days', true)) + 1;
		}

		return {
			user: Session.user.toJSON(),
			site: Session.site.toJSON(),
			endtrial_date: plan ? format.formatDate(plan.endtrial_date) : '',
			closing_date: plan ? format.formatDate(plan.closing_date) : '',
			interval_closing: interval_closing,
			interval_trial: interval_trial,
			plural: format.plural,
			has_scope_subscription: Session.hasScope('site:subscription')
		};
	},

	onRender: function() {

		this.stats.clear().set(this.stats.defaults); // RAZ stats when changing site
		this.stats.fetch();


		this.dashboardPrefs.fetch().done(function() {

			// Widgets
			var widgets = new Backbone.Collection();
			widgets.model = Backbone.Model.extend({
				idAttribute: 'type',
				defaults: {
					type: '',
					order: 0,
					size: 5
				}
			});
			var order = 0;
			var list = _.map(this.dashboardPrefs.get('widgets'), function(widget) {
				return {
					type: widget,
					order: order++,
					size: (order % 2 == 0) ? 7 : 5
				};
			});
			widgets.add(list);

			var view = new GraphView({
				report: this.report,
				stat: 'visitors', // defaults
				live: this.live,
				stats: this.stats,
				extra_fields: fieldsNeeded(widgets)
			});
			this.showChildView('graph', view);
			view.fetch();

			this.showChildView('widgets', new WidgetGridView({
				collection: widgets,
				childViewOptions: {
					report: this.report
				}
			}));

			if (this.dashboardPrefs.get('messages') && this.dashboardPrefs.get('messages').length > 0) {
				var MsgView = new MessagesView({
					messages: this.dashboardPrefs.get('messages')
				});
				this.showChildView('messages', MsgView);
			}

		}.bind(this)).fail(function() {
			console.log('Dashboard - FAILED'); // TODO
		}.bind(this));

	}

});
