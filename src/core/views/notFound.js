var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/notFound.html'),

	initialize: function(options) {
		this.mergeOptions(options, ['message']);
	},

	templateContext: function() {
		return {
			message: this.message
		};
	}

});
