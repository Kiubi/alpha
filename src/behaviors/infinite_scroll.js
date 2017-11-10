var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.Behavior.extend({

	defaults: {
		renderThreshold: 50,
		scrollThreshold: 250,
		contentEl: '#content'
	},

	initialize: function() {
		if (this.view.getOption('scrollThreshold')) this.options.scrollThreshold =
			this.view.getOption('scrollThreshold');
	},

	onAttach: function() {
		Backbone.$(this.options.contentEl).bind("scroll", this, this.scrollHandler);
	},

	onDestroy: function() {
		Backbone.$(this.options.contentEl).unbind("scroll", this.scrollHandler);
	},

	/**
	 * Fetch next page
	 */
	collectionFetchNextPage: function() {
		var behavior = this;
		var collection = this.view.collection;

		if (!collection.meta || !collection.meta.link) {
			return;
		}

		if (!collection || collection.isSyncing) {
			return;
		}
		collection.isSyncing = true;

		if (!collection.meta.link.next_page) {
			// derniere page atteinte,
			collection.isSyncing = false;
			return;
		}

		collection.fetch({
			url: collection.meta.link.next_page,
			remove: false
		}).always(function() {
			collection.isSyncing = false;
			behavior.onDomRefresh();
		});
	},

	/**
	 * Test scroll depth and fetch next page if necessary
	 * 
	 * @param {Event} event
	 */
	scrollHandler: function(event) {
		var behavior = event.data;

		var scrollHeight = (Backbone.$(behavior.options.contentEl).scrollTop() +
			Backbone.$(behavior.options.contentEl).height());
		var threshold = (Backbone.$(behavior.options.contentEl + ' div').height() -
			behavior.options.scrollThreshold);

		if (scrollHeight < threshold) return;

		behavior.collectionFetchNextPage();
	},

	/**
	 * Fetch next page if content child is smaller than content
	 */
	onDomRefresh: function() {
		if (Backbone.$(this.options.contentEl + ' div').height() - this.options.renderThreshold <
			Backbone.$(this.options.contentEl).height()) {
			this.collectionFetchNextPage();
		}
	}

});
