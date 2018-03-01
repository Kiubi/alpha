var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	options: {
		contentEl: '#content'
	},

	level: 0,
	offset: null,

	initialize: function(options) {
		this.listenTo(this.view, 'freeze:scroll', this.onFreezeScroll);
		this.listenTo(this.view, 'unfreeze:scroll', this.onUnFreezeScroll);
	},

	onFreezeScroll: function() {
		this.level++;
		if (this.level == 1) {
			this.offset = Backbone.$(this.options.contentEl).scrollTop();
		}
	},

	onUnFreezeScroll: function() {
		this.level--;
		if (this.level <= 0) {
			this.level = 0;
			if (this.offset != null) {
				Backbone.$(this.options.contentEl).scrollTop(this.offset);
			}
			this.offset = null;
		}
	}

});
