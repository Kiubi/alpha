var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Forms = require('../models/forms');

var ControllerChannel = Backbone.Radio.channel('controller');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'forms',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.unread_count = 0;

		this.forms = new Forms();
		this.listenTo(this.forms, 'sync', function() {
			this.unread_count = this.forms.reduce(function(memo, model) {
				return memo + model.get('replies_unread_count');
			}, 0);
			this.render();
		}.bind(this));
		this.forms.fetch();

		this.listenTo(ControllerChannel, 'refresh:forms', this.onRefreshForms);
	},

	templateContext: function() {
		return {
			unread_count: this.unread_count
		};
	},

	onRefreshForms: function(delta) {

		if (delta == null) {
			this.forms.fetch();
			return;
		}

		if (this.unread_count + delta < 0) {
			this.unread_count = 0;
		} else {
			this.unread_count += delta;
		}

		this.render();
	}
});
