var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../../templates/homeboard/prestataires.html'),

	tagName: 'article',
	className: 'post-article post-article-dark prestataires',

	events: {
		'click a[data-role="support"]': function(event) {
			window.open(this.session.autologAccountLink('/support/'));
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['session']);
	},

	templateContext: function() {

		var activeTab = 'doc';

		var has_theme = false;

		if (this.session.hasScope('site:theme')) {
			has_theme = true;
			activeTab = 'theme';
		}

		return {
			has_theme: has_theme,
			activeTab: activeTab
		};
	}

});
