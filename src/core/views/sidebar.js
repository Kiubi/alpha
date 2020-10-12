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
			var total_used = Math.max(this.model.get('space').used, this.model.get('space').total);
			prct_medias = Math.round(this.model.get('space').medias * 100 / total_used);
			prct_ftp = Math.round(this.model.get('space').ftp * 100 / total_used);
			prct_datas = Math.round(this.model.get('space').datas * 100 / total_used);
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
			prct_free: Math.max(0, 100 - prct_medias - prct_ftp - prct_datas),
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

	behaviors: [TooltipBehavior],

	regions: {
		'usage': {
			el: '[data-role="usage"]',
			replaceElement: true
		}
	},

	triggers: {
		'click span[data-role="close"]': 'sidebarmenu:toggle'
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
				window.open(this.session.autologAccountLink('/users/'));
			} else {
				if (!this.session.hasScope('site:users')) return;
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
		'click a[data-role="account"]': function() {
			window.open(this.session.autologAccountLink('/dashboard/'));
		}
	},

	ui: {
		'items': '.nav-item'
	},

	templateContext: function() {
		var plan = this.session.site.get('plan'),
			account_label,
			account_badge;

		switch (this.session.site.get('account') && this.session.site.get('account').account_level) {
			case 'expert':
				account_label = 'Expert';
				account_badge = 'badge-warning';
				break;
			case 'premium':
				account_label = 'Premium';
				account_badge = 'badge-success';
				break;
			default:
				account_label = 'Admin';
				account_badge = 'badge-secondary';
				break;
		}

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
			userAvatar: this.session.user.getAvatar(),
			accountBadge: account_badge,
			accountLabel: account_label
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
		var root = '/' + (data.path + "/").split(/\/|\?/)[1];
		this.getUI('items').removeClass('active');

		var query = (root === '/') ? "a[href='" + root + "']" : "a[href^='" + root + "']";
		this.getUI('items').find(query).parent().addClass('active');
	}

});
