var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/theme.html'),
	className: 'container container-locked alerte-rwd',
	service: 'themes',

	behaviors: [SelectifyBehavior],

	ui: {
		'pwdBtn': 'a[data-role="password-toggle"]',
		'pwdMask': 'span[data-role="password-mask"]',
		'defaultBtn': 'a[data-role="default"]',
		'customBtn': 'a[data-role="custom"]',
		'selectVariant': '[data-role="select-variant"]'
	},

	events: {
		'click @ui.pwdBtn': function() {
			this.getUI('pwdBtn').hide();
			this.getUI('pwdMask').show();
		},
		'click @ui.defaultBtn': function() {

			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showOverlay();

			var fail = function(xhr) {
				navigationController.showErrorModal(xhr);
			};

			this.themes.fetch().then(function() {
				var theme = this.themes.find(function(model) {
					return model.get('code') != 'theme';
				});
				if (!theme) {
					fail('Aucun theme disponible');
				}

				this.themes.changeTheme(theme.get('code')).done(function(theme) {
					this.current = theme;
					this.render();
					navigationController.hideModal();
				}.bind(this)).fail(fail);

			}.bind(this), fail);

		},
		'click @ui.customBtn': function() {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showOverlay();

			var fail = function(xhr) {
				navigationController.showErrorModal(xhr);
			};

			this.themes.fetch().then(function() {

				var theme = this.themes.find(function(model) {
					return model.get('code') == 'theme';
				});

				// Custom already exists
				if (theme) {
					this.themes.changeTheme('theme').done(function(theme) {
						this.current = theme;
						this.render();
						navigationController.hideModal();
					}.bind(this)).fail(fail);
				} else {
					// Need to create custom theme first
					navigationController.navigate('/themes/custom');
					navigationController.hideModal();
				}

			}.bind(this), fail);
		},
		'click @ui.selectVariant': function(event) {

			var variant = Backbone.$(event.currentTarget).data('id');

			this.themes.changeThemeVariants(variant).done(function() {
				// console.log('OK');
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);
			}.bind(this));
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['ftp', 'current', 'themes']);
	},

	templateContext: function() {
		return {
			ftp: this.ftp.toJSON(),
			theme: this.current.toJSON(),
			theme_img: Session.convertThemePath('/themes/' + this.current.get('code') + '/illustration.jpg'),
			theme_download: (this.current.get('code') == 'theme') ? null : Session.convertThemePath('/themes/' + this.current
				.get('code') + '/' + this.current.get('code') + '.zip')
		};
	}

});
