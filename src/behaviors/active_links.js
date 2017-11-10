var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var navigationChannel = Backbone.Radio.channel('navigation');

module.exports = Marionette.Behavior.extend({

	options: {
		maxDepth: 3 // /service/type/id/* match /service/type/id
	},

	initialize: function(options) {
		// Listen to change:url event on navigation channel
		this.listenTo(navigationChannel, 'change:url', function(data) {
			this.activateLink(data.path);
		});
	},

	/**
	 * Activate links in sidebarMenu
	 *
	 * @param {String} path
	 */
	activateLink: function(path) {

		// Limit path matching to first maxDepth directories
		path = path.split('/', this.getOption('maxDepth') + 1).join('/');

		Backbone.$('li a', this.view.el).parent().removeClass('active');
		Backbone.$('li a[href="' + path + '"]', this.view.el).parent().addClass('active');
	},

	onRender: function() {
		// make sure that we highlight url
		this.activateLink(document.location.pathname);
	}

});
