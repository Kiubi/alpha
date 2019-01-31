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
			console.log('clear');
			this.code_site = null;
			this.render();
		}
	},

	code_site: null,

	initialize: function(options) {
		this.mergeOptions(options, ['code_site']);
	},

	templateContext: function() {
		return {
			code_site: this.code_site
		};
	},

	/**
	 * 
	 * @returns {boolean}
	 */
	handleSave: function(e) {
		e.preventDefault();
		this.showError();
		this.trigger('form-login:submit', {
				'login': this.getUI('login').val(),
				'password': this.getUI('password').val(),
				'code_site': this.code_site
			},
			this);
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
