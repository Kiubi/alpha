var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var TooltipBehavior = require('kiubi/behaviors/tooltip');

var navigationChannel = Backbone.Radio.channel('navigation');

module.exports = Marionette.View.extend({

	template: require('../templates/sidebar.html'),

	behaviors: [TooltipBehavior],

	triggers: {
		'click span.bt-closed': 'sidebarmenu:toggle'
	},

	templateContext: function() {
		return {
			user: this.session.user.toJSON(),
			isAuth: this.session.user.isAuth(),
			mainItems: this.getLinks('main'),
			toolsItems: this.getLinks('tools')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options, ['session', 'collection']);

		this.listenTo(navigationChannel, 'change:url', this.onChangeURL);
		this.listenTo(this.session.site, 'change:site', this.render);
	},

	getLinks: function(type) {
		var links = this.collection.where({
			type: type
		});
		_.each(links, function(model) {
			var scope = (model.get('scope') == null || this.session.hasScope(model.get('scope')));
			var feature = (model.get('feature') == null || this.session.hasFeature(model.get('feature')));
			model.set('is_enabled', scope && feature);
		}.bind(this));
		return _.invoke(links, 'toJSON');
	},

	/**
	 * Listen to change:url event on navigation channel. Activate links in sidebar
	 *
	 * @param {Object} data
	 */
	onChangeURL: function(data) {
		var activeItem = this.collection.findWhere({
			is_active: true
		});

		var root = '/' + (data.path + "/").split(/\/|\?/)[1];
		if (activeItem && activeItem.get('path') == root) {
			// no change needed
			return;
		}

		var model = this.collection.findWhere({
			path: root
		});
		if (!model) {
			return;
		}
		if (activeItem) {
			// in doubt clear all items
			this.collection.invoke('set', 'is_active', false);
		}
		model.set('is_active', true);

		this.render();
	}

});
