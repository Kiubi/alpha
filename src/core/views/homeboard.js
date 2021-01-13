var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var TrackingBehavior = require('kiubi/behaviors/tracking');

var PlanView = require('./dashboard/plan.js');
var TipsView = require('./dashboard/tips.js');
var PorteursAdvicesView = require('./homeboard/porteurs.js');
var PrestatairesAdvicesView = require('./homeboard/prestataires.js');

var Session;

module.exports = Marionette.View.extend({
	template: require('../templates/homeboard.html'),

	behaviors: [{
		behaviorClass: TrackingBehavior,
		defaultCategoty: 'Homeboard'
	}],

	regions: {
		plan: {
			el: "div[data-role='plan']",
			replaceElement: true
		},
		advices: {
			el: "article[data-role='advices']",
			replaceElement: true
		},
		tips: {
			el: "article[data-role='tips']",
			replaceElement: true
		}
	},

	initialize: function() {
		Session = Backbone.Radio.channel('app').request('ctx:session');
	},

	templateContext: function() {
		return {
			account_type: Session.site.get('account').account_type,
			show_cms: Session.hasScope('site:cms'),
			show_blog: Session.hasScope('site:blog'),
			show_catalog: Session.hasScope('site:catalog') && Session.hasFeature('catalog'),
			show_checkout: Session.hasScope('site:checkout') && Session.hasFeature('checkout'),
			show_customers: Session.hasScope('site:account'),
			show_layout: Session.hasScope('site:layout'),
			show_theme: Session.hasScope('site:theme'),
			show_pref: Session.hasScope('site:pref')
		};
	},

	onRender: function() {

		if (Session.site && Session.site.get('account')) {
			if (Session.site.get('account').account_type === 'porteur') {
				this.showChildView('advices', new PorteursAdvicesView({
					session: Session
				}));
			} else {
				this.showChildView('advices', new PrestatairesAdvicesView({
					session: Session
				}));
			}
		}

		this.showChildView('plan', new PlanView({
			session: Session
		}));

		this.showChildView('tips', new TipsView({}));
	}

});
