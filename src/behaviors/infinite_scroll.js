var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.Behavior.extend({

	options: {
		renderThreshold: 50,
		scrollThreshold: 250,
		contentEl: '#content'
	},

	callback: null,
	$scroll: null,

	initialize: function() {
		if (this.view.getOption('scrollThreshold')) this.options.scrollThreshold = this.view.getOption('scrollThreshold');

		this.callback = _.debounce(this.scrollHandler, 150).bind(this);
		this.$scroll = Backbone.$(this.options.contentEl); // global scope
	},

	onAttach: function() {
		this.$scroll.bind("scroll", this, this.callback);
	},

	onDestroy: function() {
		this.$scroll.unbind("scroll", this.callback);
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
		var scrollHeight = this.$scroll.scrollTop() + this.$scroll.height();
		var threshold = (Backbone.$(this.options.contentEl + ' div').height() - this.options.scrollThreshold);

		if (scrollHeight < threshold) return;

		this.collectionFetchNextPage();
	},

	/**
	 * Fetch next page if content child is smaller than content
	 */
	onDomRefresh: function() {
		if (Backbone.$(this.options.contentEl + ' div').height() - this.options.renderThreshold < this.$scroll.height()) {
			this.collectionFetchNextPage();
		}
	}

});
