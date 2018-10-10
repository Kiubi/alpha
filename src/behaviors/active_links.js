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

		var links = Backbone.$('li a', this.view.el);
		links.parent().removeClass('active');

		// Limit path matching to first maxDepth directories
		var split = path.split("?")[0].split(/\/|\?/, this.getOption('maxDepth') + 1);
		var tests = [document.location.origin + path];
		while (split.length > 1) {
			tests.push(document.location.origin + split.join('/'));
			split.pop();
		}

		// Try matching longest path first then remove parts one by one
		var aLinks;
		for (var i = 0; i < tests.length; i++) {
			aLinks = links.filter(function(index) {
				return this.href == tests[i];
			});
			if (aLinks.length) {
				aLinks.parent().addClass('active');
				return;
			}
		}
	},

	onRender: function() {
		// make sure that we highlight url
		this.activateLink(window.location.pathname + window.location.search);
	}

});
