var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'prefs',
	behaviors: [ActiveLinksBehaviors],

	templateContext: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			has_scope_pref: Session.hasScope('site:pref'),
			has_scope_domains: Session.hasScope('site:domains'),
			has_scope_cms: Session.hasScope('site:cms'),
			has_scope_seo: Session.hasScope('site:seo')
		};
	}
});
