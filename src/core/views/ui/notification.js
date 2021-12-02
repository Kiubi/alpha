var _ = require('underscore');
var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var BasicVue = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/notification.html'),

	templateContext: function() {
		return {
			title: this.model.getTitle(),
			url: this.model.getURL(),
			code: this.model.getCode(),
			icon: this.mapIcon(this.model.get('type'))
		};
	},

	mapIcon: function(type) {
		switch (type) {
			default:
				return null;
			case 1:
				return 'md-activity-checkout';
			case 2:
				return 'md-activity-comment';
			case 3:
				return 'md-activity-evaluation';
			case 4:
				return 'md-activity-form';
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	onAttach: function() {
		Backbone.$('.toast', this.$el).toast('show');
	}

});


module.exports = Marionette.CollectionView.extend({

	tagName: 'div',
	childView: BasicVue,

});
