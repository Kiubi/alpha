var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Catalog = require('../models/catalog');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'catalog',
	behaviors: [ActiveLinksBehaviors],

	initialize: function(options) {

		this.overview = new Catalog();

		this.fetchAndRender();
	},

	templateContext: function() {
		return {
			overview: this.overview.toJSON()
		};
	},

	fetchAndRender: function() {
		Backbone.$.when(
			this.overview.fetch()
		).done(function() {
			this.render();
		}.bind(this)).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	onRefreshProducts: function(count) {
		if (count == null) {
			this.overview.fetch().done(function() {
				this.render();
			}.bind(this));
			return;
		}

		if (this.overview.get('products_count') + count < 0) {
			this.overview.set('products_count', 0);
		} else {
			this.overview.set('products_count', this.overview.get('products_count') + count);
		}

		this.render();
	}

});
