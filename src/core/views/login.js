var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');

var TipsView = require('./login.tips.js');

var View = Marionette.View.extend({
	className: 'login',
	template: require('../templates/login.html'),

	ui: {
		login: '#login_input',
		group_login: '#group_login',
		password: '#password_input',
		group_password: '#group_password',
		remember: '#remember_input',
		alert: '.alert-danger',
		submitBtn: 'button[data-role="submit"]'
	},

	events: {
		'click @ui.submitBtn': 'handleSave',
		'submit form': 'handleSave',
		'click a[data-role="clear"]': function() {
			this.code_site = null;
			this.render();
		}
	},

	regions: {
		tips: {
			el: "div[data-role='tips']",
			replaceElement: true
		}
	},


	code_site: null,
	cobranding: null,
	loaded: null,
	Session: null,
	lockLogin: false,

	initialize: function(options) {
		this.mergeOptions(options, ['code_site', 'cobranding', 'Session']);
		if (this.cobranding) {
			this.loaded = false;
			this.cobranding.fetch({
				data: {
					code_site: this.code_site
				}
			}).always(function() {
				this.loaded = true;
				this.render();
			}.bind(this));
		} else {
			this.loaded = true;
		}
		this.lockLogin = false;
	},

	templateContext: function() {
		var cobranding_background, cobranding_logo, login, cobranded;

		if (this.loaded) {
			cobranding_background = '/assets/img/bg_login_f.jpg';
			cobranding_logo = '/assets/img/logo_kiubi.png';
			cobranded = false;
			if (this.cobranding) {
				var cobranding = this.cobranding.get('login');
				if (cobranding.background) cobranding_background = cobranding.background;
				if (cobranding.logo) {
					cobranding_logo = cobranding.logo;
					cobranded = true;
				}
			}
		}

		var config = Backbone.Radio.channel('app').request('ctx:config');

		return {
			code_site: this.code_site,
			cobranding_background: cobranding_background,
			cobranding_logo: cobranding_logo,
			year: new Date().getFullYear(),
			login: this.Session.getValue('last_login') || '',
			account: config.get('account'),
			cobranded: cobranded
		};
	},

	/**
	 *
	 * @returns {boolean}
	 */
	handleSave: function(e) {
		e.preventDefault();

		if (this.lockLogin) return;
		this.lockLogin = true;

		e.preventDefault();
		this.showError();

		var btn = this.getUI('submitBtn');
		btn.addClass('btn-load');
		var old = btn.text();
		btn.html(LoaderTpl());

		this.Session.authenticate(this.getUI('login').val(), this.getUI('password').val(), this.code_site)
			.done(function() {

				if (this.getUI('remember').prop("checked")) {
					this.Session.storeValue('last_login', this.getUI('login').val());
				} else {
					this.Session.storeValue('last_login', '');
				}

				this.trigger('success:login');
			}.bind(this))
			.fail(function(error) {
				this.showError(error);
				btn.removeClass('btn-load');
				btn.text(old);
			}.bind(this))
			.always(function() {
				this.lockLogin = false;
			}.bind(this));

		return false;
	},

	/**
	 *
	 * @param {String} error
	 */
	showError: function(error) {
		if (error === undefined) {
			this.getUI('alert').hide();
			this.getUI('group_login').removeClass('has-error');
			this.getUI('group_password').removeClass('has-error');
			return;
		}

		this.getUI('alert').text(error);
		this.getUI('alert').show();
		this.getUI('group_login').addClass('has-error');
		this.getUI('group_password').addClass('has-error');
	},

	onRender: function() {
		this.showChildView('tips', new TipsView({}));
	}

});

module.exports = View;
