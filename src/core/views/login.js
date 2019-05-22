var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
	className: 'login',
	template: require('../templates/login.html'),

	ui: {
		login: '#login_input',
		group_login: '#group_login',
		password: '#password_input',
		group_password: '#group_password',
		remember: '#remember_input',
		alert: '.alert-danger'
	},

	events: {
		'submit form': 'handleSave',
		'click a[data-role="clear"]': function() {
			this.code_site = null;
			this.render();
		}
	},

	code_site: null,
	cobranding: null,
	loaded: null,
	Session: null,

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
	},

	templateContext: function() {
		var cobranding_background, cobranding_logo, login;

		if (this.loaded) {
			cobranding_background = '/assets/img/bg_login_g.jpg';
			cobranding_logo = '/assets/img/logo_kiubi.png';
			if (this.cobranding) {
				var cobranding = this.cobranding.get('login');
				if (cobranding.background) cobranding_background = cobranding.background;
				if (cobranding.logo) cobranding_logo = cobranding.logo;
			}
		}

		var config = Backbone.Radio.channel('app').request('ctx:config');

		return {
			code_site: this.code_site,
			cobranding_background: cobranding_background,
			cobranding_logo: cobranding_logo,
			year: new Date().getFullYear(),
			login: this.Session.getValue('last_login') || '',
			account: config.get('account')
		};
	},

	/**
	 * 
	 * @returns {boolean}
	 */
	handleSave: function(e) {
		e.preventDefault();
		this.showError();

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
	}

});

module.exports = View;
