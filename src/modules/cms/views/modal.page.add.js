var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/modal.page.add.html'),

	menu_id: null,

	ui: {
		'select-page': 'div[data-role="select-page"]',
		'select-intlink': 'div[data-role="select-intlink"]',
		'select-extlink': 'div[data-role="select-extlink"]',
		'select-separator': 'div[data-role="select-separator"]'
	},

	events: {
		'click @ui.select-page': function() {
			this.trigger('select:page', {
				menu_id: this.getOption('menu_id')
			});
		},
		'click @ui.select-intlink': function() {
			this.trigger('select:intLink', {
				menu_id: this.getOption('menu_id')
			});
		},
		'click @ui.select-extlink': function() {
			this.trigger('select:extLink', {
				menu_id: this.getOption('menu_id')
			});
		},
		'click @ui.select-separator': function() {
			this.trigger('select:separator', {
				menu_id: this.getOption('menu_id')
			});
		}
	},

	initialize: function(options) {
		this.mergeOptions(options);
	}

});
