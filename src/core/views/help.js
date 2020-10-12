var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var TrackingBehavior = require('kiubi/behaviors/tracking');

var TipsView = require('./dashboard/tips.js');

var Session;

module.exports = Marionette.View.extend({
	template: require('../templates/help.html'),

	behaviors: [{
		behaviorClass: TrackingBehavior,
		defaultCategoty: 'Help'
	}],

	regions: {
		tips: {
			el: "article[data-role='tips']",
			replaceElement: true
		}
	},


	initialize: function(options) {
		Session = Backbone.Radio.channel('app').request('ctx:session');
		this.mergeOptions(options, ['model']);
		this.model.fetch().done(
			function() {
				this.render()
			}.bind(this)
		);
	},


	templateContext: function() {
		return {
			user: Session.user.toJSON(),
			contact: this.model.toJSON()
		};
	},

	onRender: function() {
		this.showChildView('tips', new TipsView({}));
	}

});
