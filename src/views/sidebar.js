var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var navigationChannel = Backbone.Radio.channel('navigation');

module.exports = Marionette.View.extend({

	template: require('../templates/sidebar.html'),

	triggers: {
		'click a.bt-closed': 'sidebarmenu:toggle'
	},

	modelEvents: {
		'authenticate': 'onAuthenticate'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'collection']);

		this.listenTo(navigationChannel, 'change:url', this.onChangeURL);
	},

	serializeWhere: function(props) {
		return _.invoke(this.collection.where(props), 'toJSON');

	},

	templateContext: function() {
		return {
			isAuth: this.model.isAuth(),
			initials: this.model.get('firstname').charAt(0) + '.' + this.model.get(
				'lastname').charAt(0) + '.',
			mainItems: this.serializeWhere({
				type: 'main'
			}),
			toolsItems: this.serializeWhere({
				type: 'tools'
			})
		};
	},

	onAuthenticate: function() {
		this.render();
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

		var root = '/' + (data.path + "/").split(/\//)[1];

		if (activeItem && activeItem.get('path') == root) {
			// no change needed
			return;
		}

		var model = this.collection.findWhere({
			path: '/' + (data.path + "/").split(/\//)[1]
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
