var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

function contentHeight(selector) {
	return Backbone.$(selector + ' > div')
		.toArray()
		.reduce(function(accumulator, el) {
			return Backbone.$(el).outerHeight(true) + accumulator;
		}, 0);
}

module.exports = Marionette.Behavior.extend({

	options: {
		renderThreshold: 50,
		scrollThreshold: 250,
		contentEl: '#content'
	},

	callback: null,
	$scroll: null,

	initialize: function() {
		if (this.view.getOption('scrollThreshold') != undefined) {
			this.options.scrollThreshold = this.view.getOption('scrollThreshold');
		}
		if (this.view.getOption('scrollContentEl')) {
			this.options.contentEl = this.view.getOption('scrollContentEl');
		}

		this.callback = _.debounce(this.scrollHandler, 150).bind(this);
	},

	onAttach: function() {
		this.$scroll = Backbone.$(this.options.contentEl); // global scope
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
		var threshold = contentHeight(this.options.contentEl) - this.options.scrollThreshold;

		if (scrollHeight < threshold) return;

		this.collectionFetchNextPage();
	},

	onDomRefresh: function() {
		if (!this.$scroll) return;

		// Fetch next page if content child is smaller than content
		if (contentHeight(this.options.contentEl) - this.options.renderThreshold < this.$scroll.height()) {
			this.collectionFetchNextPage();
		}
	}

});
