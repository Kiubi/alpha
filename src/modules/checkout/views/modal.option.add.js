var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/modal.option.add.html'),

	ui: {
		'select-simple': 'div[data-role="select-simple"]',
		'select-textarea': 'div[data-role="select-textarea"]',
		'select-select': 'div[data-role="select-select"]'
	},

	events: {
		'click @ui.select-simple': function() {
			this.trigger('select:type', {
				type: 'simple'
			});
		},
		'click @ui.select-textarea': function() {
			this.trigger('select:type', {
				type: 'textarea'
			});
		},
		'click @ui.select-select': function() {
			this.trigger('select:type', {
				type: 'select'
			});
		}
	}

});
