var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var menuTree = require('./menuTree.js');

module.exports = Marionette.View.extend({

	template: _.template(
		'<%= menu %>'
	),

	events: {
		'show.bs.collapse': function(event) {
			const $el = Backbone.$('[href="#' + event.target.id + '"]', this.el);
			$el.parent().removeClass('menu-expand-more').addClass('menu-expand-less');
			this.menuTree.openNode($el.data('id'));
		},
		'hide.bs.collapse': function(event) {
			const $el = Backbone.$('[href="#' + event.target.id + '"]', this.el);
			$el.parent().removeClass('menu-expand-less').addClass('menu-expand-more');
			this.menuTree.closeNode($el.data('id'));
		},
		'click a': function(event) {
			var $link = Backbone.$(event.currentTarget);
			if ($link.attr('href') == '#') {
				// Not a treemenu link
				// If caret found, simulate click
				$link.parent().find('.menu-expand').trigger('click');
				return;
			}
			Backbone.$('a', this.el).parent().removeClass('active');
			$link.parent().addClass('active');
		}
	},

	menuTree: null,
	rootNode: null,

	initialize: function(options) {
		// this.mergeOptions(options, ['nodeInfo', 'rootFooter', 'expandByDefault']);
		this.menuTree = new menuTree(options);
	},

	templateContext: function() {
		return {
			'menu': this.menuTree.render(this.rootNode).html
		};
	},

	setTree: function(rootNode) {
		this.rootNode = rootNode;
		this.render();
	}

});
