var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'modules',
	behaviors: [ActiveLinksBehaviors],

	templateContext: function() {
		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			has_scope_seo: Session.hasScope('site:seo'),
			has_scope_modules: Session.hasScope('site:modules'),
			has_scope_checkout: Session.hasScope('site:checkout'),
			has_scope_marketing: Session.hasScope('site:marketing'),
			has_scope_cms: Session.hasScope('site:cms'),
			has_scope_catalog: Session.hasScope('site:catalog'),
			has_scope_blog: Session.hasScope('site:blog'),
			has_scope_backup: Session.hasScope('site:backup'),
			has_scope_pref: Session.hasScope('site:pref'),
			has_feature_extranet: Session.hasFeature('extranet'),
			has_feature_catalog: Session.hasFeature('catalog'),
			has_feature_checkout: Session.hasFeature('checkout'),
			has_feature_fidelity: Session.hasFeature('fidelity'),
			has_feature_advanced_media: Session.hasFeature('advanced_media'),
			has_feature_multi_pickup: Session.hasFeature('multi_pickup'),
			has_feature_tier_prices: Session.hasFeature('tier_prices')
		};
	}

});
