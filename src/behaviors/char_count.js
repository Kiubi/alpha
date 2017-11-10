var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	ui: {
		inputs: "[data-behavior='countable'] input,[data-behavior='countable'] textarea"
	},

	events: {
		'keyup @ui.inputs': 'charUpdate'
	},

	onRender: function() {
		this.getUI('inputs').each(function(i, el) {
			this.charCounts(el);
		}.bind(this));
	},

	/**
	 * 
	 * @param {Node} el
	 */
	charCounts: function(el) {
		if (!el || !el.parentElement) return;
		Backbone.$('.letter-counter', el.parentElement).text(Backbone.$(el).val().length);
	},

	/**
	 * 
	 * @param {Event} event
	 */
	charUpdate: function(event) {
		this.charCounts(event.target);
	}

});
