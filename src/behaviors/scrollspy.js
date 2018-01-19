var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	defaults: {
		target: '#nav-spy'
	},

	initialize: function(options) {
		this.mergeOptions(options);
	},

	onAttach: function() { // Need heigth calculation

		var list = '';
		Backbone.$('[id^=spy]', this.view.el).each(function() {
			list += '<li><a href="#' + this.id + '">' + (this.title ? this.title : '#' + this.id) + '</a></li>';
		});

		Backbone.$(this.options.target + ' ul', this.view.el).html(list);

		this.view.$el.parent().scrollspy({
			target: this.options.target
		});
	}

});
