var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Categories = require('../models/categories');
var Blog = require('../models/blog');
var Home = require('../models/home');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

var ControllerChannel = Backbone.Radio.channel('controller');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'blog',

	behaviors: [ActiveLinksBehaviors],

	ui: {
		'btn-category-add': 'a[data-role="category-add"]'
	},

	events: {
		'click @ui.btn-category-add': function() {
			this.trigger('add:category');
		}
	},

	is_loaded: null,

	initialize: function(options) {

		this.categories = new Categories();
		this.home = new Home();
		this.overview = new Blog();
		this.is_loaded = false;

		this.listenTo(ControllerChannel, 'refresh:categories', this.onRefreshCategories);

		this.fetchAndRender();
	},

	fetchAndRender: function() {
		Backbone.$.when(
			this.categories.fetch(),
			this.home.fetch(),
			this.overview.fetch()
		).done(function() {
			this.is_loaded = true;
			this.render();
		}.bind(this)).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	templateContext: function() {
		return {
			is_loaded: this.is_loaded,
			categories: this.categories.toJSON(),
			home: this.home.toJSON(),
			overview: this.overview.toJSON()
		};
	},

	onRefreshCategories: function() {
		Backbone.$.when(
			this.categories.fetch(),
			this.home.fetch()
		).done(function() {
			this.render();
		}.bind(this));
	},

	onRefreshPosts: function(count) {
		if (count == null) {
			this.overview.fetch().done(function() {
				this.render();
			}.bind(this));
			return;
		}

		if (this.overview.get('posts_count') + count < 0) {
			this.overview.set('posts_count', 0);
		} else {
			this.overview.set('posts_count', this.overview.get('posts_count') + count);
		}

		this.render();
	}

});
