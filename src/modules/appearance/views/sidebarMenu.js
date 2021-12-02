var Marionette = require('backbone.marionette');
var Layout = require('../models/layout');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'appearance',
	behaviors: [ActiveLinksBehaviors],

	pages: [],

	initialize: function(options) {

		var m = new Layout();

		m.getTypes().done(function(types) {
			this.types = types;
			this.render();
		}.bind(this));

	},

	templateContext: function() {
		return {
			types: this.types
		};
	}

});
