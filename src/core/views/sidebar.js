var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var navigationChannel = Backbone.Radio.channel('navigation');

var UsageView = require('./sidebar/usage');
var NotificationView = require('./sidebar/notifications');

module.exports = Marionette.View.extend({

	template: require('../templates/sidebar.html'),

	behaviors: [TooltipBehavior],

	regions: {
		'usage': {
			el: '[data-role="usage"]',
			replaceElement: true
		},
		'notifications': {
			el: '[data-role="notifications"]',
			replaceElement: true
		}
	},

	ui: {
		'items': '.nav-item',
		'toggleBtn': 'span[data-role="close"]',
		'notificationBtn': '.nav-item.notifications'
	},

	triggers: {
		'click @ui.toggleBtn': 'sidebarmenu:toggle'
	},

	events: {
		'click a[data-role="logout"]': function() {
			this.session.logout();
		},
		'shown.bs.dropdown .notifications': function(event) {
			if (this.getChildView('notifications')) {
				this.notificationcenter.markAsRead();
				this.getChildView('notifications').fetch();
			}
		},
		'shown.bs.dropdown .user': function(event) {
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

	initialize: function(options) {
		this.mergeOptions(options, ['session', 'collection']);

		this.listenTo(navigationChannel, 'change:url', this.onChangeURL);
		this.listenTo(this.session.site, 'change:site', function() {
			this.render();
			this.usageView.fetch();
		}.bind(this));

		this.usageView = new UsageView();

		this.notificationcenter = Backbone.Radio.channel('app').request('ctx:notificationCenter');
		if (this.notificationcenter) {
			this.timeoutNotification = null;
			this.listenTo(this.notificationcenter, 'notification:order notification:response notification:comment notification:evaluation', function() {
				this.getUI('notificationBtn').addClass('dring');
				this.timeoutNotification = setTimeout(function() {
					this.getUI('notificationBtn').removeClass('dring');
				}.bind(this), 6000);
			});
			this.listenTo(this.notificationcenter, 'update:unread', this.onChangeNotificationCount);
		}
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
			accountLabel: account_label,
			showNotifications: !!this.notificationcenter
		};
	},

	onBeforeRender: function() {
		if (this.usageView.isAttached()) {
			this.detachChildView('usage');
		}
	},

	onRender: function() {
		if (this.session.user.isAuth()) {
			this.showChildView('usage', this.usageView);

			if (this.notificationcenter) {
				this.showChildView('notifications', new NotificationView());
				this.notificationcenter.refreshCount();
			}
		}

		/*Backbone.$(this.getUI('toggleBtn'), this.el).tooltip({
			delay: {
				"show": 0,
				"hide": 0
			},
			trigger: "hover",
			offset: "0, 4px",
			title: function() {
				return Backbone.$(document.body).hasClass('closed') ? 'Agrandir' : 'Réduire';
			}
		});*/
	},

	onBeforeDetach: function() {
		if (this.timeoutNotification) clearTimeout(this.timeoutNotification);
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
		this.getUI('items').children(query).parent().addClass('active');
	},

	onChangeNotificationCount: function(count) {
		if (count > 0) {
			this.getUI('notificationBtn').addClass('notifications-active');
		} else {
			this.getUI('notificationBtn').removeClass('notifications-active');
		}
	}

});
