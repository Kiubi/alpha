//var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'themes',
	behaviors: [ActiveLinksBehaviors]
});
