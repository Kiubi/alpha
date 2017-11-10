var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	onRender: function() {
		Backbone.$('[data-toggle="tooltip"]', this.view.el).tooltip();
	}

});
