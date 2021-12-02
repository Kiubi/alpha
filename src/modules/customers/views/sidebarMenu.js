var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'customers',
	behaviors: [ActiveLinksBehaviors],

	templateContext: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			has_feature_extranet: Session.hasFeature('extranet')
		};
	}
});
