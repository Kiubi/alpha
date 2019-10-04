var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var Session; // Must wait because this model is loaded BEFORE session start

/* Graph */

var GraphView = require('./dashboard/graph.js');

/* Orders */

var OrdersView = require('./dashboard/orders.js');

/* Forms */

var FormsView = require('./dashboard/forms.js');

/* Activity */

var ListView = require('kiubi/core/views/ui/list.js');
var RowView = Marionette.View.extend({
	template: require('../templates/dashboard.row.html'),
	className: 'list-item border-0',

	templateContext: function() {
		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			creation_date_fromnow: moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss').fromNow(),
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/dashboard.html'),

	behaviors: [TooltipBehavior],

	regions: {
		graph: {
			el: "article[data-role='graph']",
			replaceElement: true
		},
		orders: {
			el: "article[data-role='orders']",
			replaceElement: true
		},
		forms: {
			el: "article[data-role='forms']",
			replaceElement: true
		},
		list: {
			el: "article[data-role='list']",
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
		this.mergeOptions(options, ['stats', 'activity', 'report', 'live']);

		// Must wait because this module is loaded BEFORE session start
		Session = Backbone.Radio.channel('app').request('ctx:session');

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

		var view = new GraphView({
			report: this.report,
			stat: 'visitors', // defaults
			live: this.live,
			stats: this.stats
		});
		this.showChildView('graph', view);
		view.fetch();

		if (Session.hasFeature('checkout')) {
			this.showChildView('orders', new OrdersView({}));
		}

		this.showChildView('forms', new FormsView({}));

		this.showChildView('list', new ListView({
			collection: this.activity,
			rowView: RowView,
			className: 'd-flex w-100',
			extraClassname: 'dashboard-activity w-100',
			extraListClassname: 'no-hover',

			title: 'Activités récentes'
			/*
			filters: [{
				extraClassname: 'select-category',
				title: 'Toutes les catégories',
				collectionPromise: this.getOption('categories').promisedSelect(this.collection.category_id)
			}]*/
		}));
		this.activity.fetch({
			reset: true
		});
	}

});
