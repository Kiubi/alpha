var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var View = Marionette.View.extend({
	el: 'body',
	template: false,
	regions: {
		header: "header",
		sidebar: "#sidebar",
		sidebarMenu: "#sidebar-menu",
		content: "#content",
		modal: "#modal"
	},
	// Desactive le comportement par défaut du drag and drop, dans
	// l'ensemble de l'application
	triggers: {
		"drop": {
			event: 'drop',
			preventDefault: true
		},
		"dragover": {
			event: 'dragover',
			preventDefault: true
		}
	},

	childViewEvents: {
		'sidebarmenu:toggle': function() {
			this.$el.toggleClass('closed');
		}
	},

	lockMenu: function() {
		this.$el.addClass('closed');
	},

	unlockMenu: function() {
		this.$el.removeClass('closed');
	},

	initialize: function(options) {
		this.mergeOptions(options, ['application']);

		var that = this;
		Backbone.$(window).resize(_.debounce(function(e) {
			if (Backbone.$(document).width() < 1155) {
				that.lockMenu();
			} else {
				that.unlockMenu();
			}
		}, 300));

		if (Backbone.$(document).width() < 1155) {
			setTimeout(this.lockMenu.bind(this), 2000);
		}
	},

	// on attache à chaque lien de la navbar un event handler permettant de
	// naviguer en pushState dans l'application
	events: {
		'click a[href^=\\/]': function(event) {
			event.preventDefault();
			var options = {
				trigger: true
			};
			if (Backbone.$(event.currentTarget).data('preventPushState')) {
				options.preventPushState = true;
			}
			this.trigger('navigate', Backbone.$(event.currentTarget).attr('href'), options);
			return false;
		}
	}
});

module.exports = View;
