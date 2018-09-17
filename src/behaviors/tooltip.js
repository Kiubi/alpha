var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	cache: null,

	initialize: function() {
		this.cache = null;
	},

	onBeforeRender: function() {
		if (this.cache) {
			this.cache.tooltip('dispose');
		}
	},

	onRender: function() {
		this.cache = Backbone.$('[data-toggle="tooltip"]', this.view.el).tooltip({
			delay: {
				"show": 400,
				"hide": 100
			}
		});
	}

});
