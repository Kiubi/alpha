var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var UsageView = Marionette.View.extend({

	template: require('../templates/account.usage.html'),

	behaviors: [TooltipBehavior],

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.listenTo(this.model, 'sync', this.render);
	},

	templateContext: function() {

		var prct_medias = 0,
			prct_ftp = 0,
			prct_datas = 0,
			prct_free = 0,
			prct_products = 0,
			prct_users = 0,
			prct_forms = 0;

		if (this.model.get('space').total) {
			prct_medias = Math.round(this.model.get('space').medias * 100 / this.model.get('space').total);
			prct_ftp = Math.round(this.model.get('space').ftp * 100 / this.model.get('space').total);
			prct_datas = Math.round(this.model.get('space').datas * 100 / this.model.get('space').total);
		}
		if (this.model.get('products').total) {
			prct_products = Math.round(this.model.get('products').used * 100 / this.model.get('products').total);
		}
		if (this.model.get('users').total) {
			prct_users = Math.round(this.model.get('users').used * 100 / this.model.get('users').total);
		}
		if (this.model.get('forms').total) {
			prct_forms = Math.round(this.model.get('forms').used * 100 / this.model.get('forms').total);
		}

		return {
			formatBytes: format.formatBytes,
			prct_medias: prct_medias,
			prct_ftp: prct_ftp,
			prct_datas: prct_datas,
			prct_free: (100 - prct_medias - prct_ftp - prct_datas),
			prct_products: prct_products,
			prct_users: prct_users,
			prct_forms: prct_forms
		};
	},

	fetch: function() {
		this.model.fetch({
			data: {
				extra_fields: 'forms,products,users'
			}
		});
	}

});

var Usage = require('kiubi/core/models/usage');

var navigationChannel = Backbone.Radio.channel('navigation');

module.exports = Marionette.View.extend({

	template: require('../templates/sidebar.html'),

	regions: {
		'usage': {
			el: '[data-role="usage"]',
			replaceElement: true
		}
	},

	triggers: {
		'click span.bt-closed': 'sidebarmenu:toggle'
	},

	events: {
		'click a[data-role="logout"]': function() {
			this.session.logout();
		},
		'shown.bs.dropdown': function(event) {
			this.usageView.fetch();
		},
		'click a[data-role="me"]': function() {
			if (this.session.user.isAdmin()) {
				window.open(this.session.autologAccountLink('/dashboard/'));
			} else {
				window.open(this.session.autologBackLink('/comptes/users/'));
			}
		},
		'click a[data-role="users"]': function() {
			window.open(this.session.autologBackLink('/comptes/users/'));
		},
		'click a[data-role="subscription"]': function() {
			window.open(this.session.autologBackLink('/comptes/formules/crediter.html'));
		},
		'click a[data-role="bill"]': function() {
			window.open(this.session.autologBackLink('/comptes/factures/'));
		},
		'click a[data-role="support"]': function() {
			window.open(this.session.autologAccountLink('/support/'));
		}
	},

	templateContext: function() {
		var plan = this.session.site.get('plan');
		return {
			user: this.session.user.toJSON(),
			site: this.session.site.toJSON(),
			isAuth: this.session.user.isAuth(),
			mainItems: this.getLinks('main'),
			toolsItems: this.getLinks('tools'),
			plural: format.plural,
			endtrial_date: plan ? format.formatDate(plan.endtrial_date) : '',
			closing_date: plan ? format.formatDate(plan.closing_date) : '',
			has_scope_subscription: this.session.hasScope('site:subscription'),
			has_scope_users: this.session.hasScope('site:users'),
			has_scope_support: this.session.hasScope('account:support')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options, ['session', 'collection']);

		this.listenTo(navigationChannel, 'change:url', this.onChangeURL);
		this.listenTo(this.session.site, 'change:site', function() {
			this.render();
			this.usageView.fetch();
		}.bind(this));

		this.usageView = new UsageView({
			model: new Usage()
		});
	},

	onBeforeRender: function() {
		if (this.usageView.isAttached()) {
			this.detachChildView('usage');
		}
	},

	onRender: function() {
		if (this.session.user.isAuth()) this.showChildView('usage', this.usageView);
	},

	getLinks: function(type) {
		var links = this.collection.where({
			type: type
		});
		_.each(links, function(model) {
			var scope = (model.get('scope') == null || this.session.hasScope(model.get('scope')));
			var feature = (model.get('feature') == null || this.session.hasFeature(model.get('feature')));
			model.set('is_enabled', scope && feature);
			model.set('blank', model.get('path').lastIndexOf('http', 0) == 0);
		}.bind(this));
		return _.invoke(links, 'toJSON');
	},

	/**
	 * Listen to change:url event on navigation channel. Activate links in sidebar
	 *
	 * @param {Object} data
	 */
	onChangeURL: function(data) {
		var activeItem = this.collection.findWhere({
			is_active: true
		});

		var root = '/' + (data.path + "/").split(/\/|\?/)[1];
		if (activeItem && activeItem.get('path') == root) {
			// no change needed
			return;
		}

		var model = this.collection.findWhere({
			path: root
		});
		if (!model) {
			return;
		}
		if (activeItem) {
			// in doubt clear all items
			this.collection.invoke('set', 'is_active', false);
		}
		model.set('is_active', true);

		this.render();
	}

});
