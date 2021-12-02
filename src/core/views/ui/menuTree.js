var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.Object.extend({

	openNodes: [],

	initialize: function(options) {
		this.mergeOptions(options, ['nodeInfo', 'expandByDefault']);
		this.openNodes = [];
	},

	/* OVERRIDE */

	nodeInfo: function(model) {
		return {
			url: '#',
			name: 'Node ' + model.cid,
			is_active: false,
			extraClassname: ''
			// is_exp: false
		};
	},

	/**
	 *
	 * @param {Number} id
	 */
	openNode: function(id) {
		if (_.indexOf(this.openNodes, id) == -1) {
			this.openNodes.push(id);
		}
	},

	/**
	 *
	 * @param {Number} id
	 */
	closeNode: function(id) {
		if (_.indexOf(this.openNodes, id) >= 0) {
			this.openNodes = _.without(this.openNodes, id);
		}
	},

	/**
	 *
	 * @param {Number} id
	 */
	isNodeOpen: function(id) {
		return (this.getOption('expandByDefault') || _.indexOf(this.openNodes, id) >= 0);
	},

	render: function(node) {

		if (!node) return '';

		var html = '';
		var has_active_child = false;

		_.each(node.childs, function(pageNode) {

			var childRender = null;
			var className = '';
			var aria = '';
			var expand = false;

			var page = this.nodeInfo(pageNode.model);
			var id = pageNode.model.get(pageNode.model.idAttribute);

			if (pageNode.childs.length > 0) {
				childRender = this.render(pageNode); // REQ !!!!!!
				expand = childRender.has_active_child || this.isNodeOpen(id);
				className += expand ? 'menu-expand-less' : 'menu-expand-more';
				aria = 'data-toggle="collapse" ' +
					'href="#menutree' + id + '" ' +
					'data-id="' + id + '" ' +
					'aria-expanded="' + (expand ? 'true' : 'false') + '" ' +
					'aria-controls="menutree' + id + '"';
				if (expand) {
					this.openNode(id);
				}
			}

			if (page.extraClassname) className += ' ' + page.extraClassname;
			if (page.is_active) {
				className += ' active';
			}

			if (page.is_active || expand) {
				has_active_child = true;
			}

			html += '<li class="nav-item ' + className + '">' +
				'<span class="md-icon menu-expand" ' + aria + '></span>' +
				'<a href="' + page.url + '" title="' + _.escape(page.name) + '" class="nav-link">' +
				'<span class="md-icon"></span>' + _.escape(page.name) +
				'</a></li>';

			if (childRender) {
				html += childRender.html;
			}

		}.bind(this));

		if (node.model) {
			// LEAF
			var id = 'menutree' + node.model.get(node.model.idAttribute);
			var collapseClass = has_active_child || this.isNodeOpen(node.model.get(node.model.idAttribute)) ? 'collapse show' :
				'collapse';
			html = '<div class="menu-tree ' + collapseClass + '" ' + 'id="' + id +
				'"><ul class="nav nav-sidebar flex-column">' +
				html +
				'</ul></div>';
		} else {
			// ROOT
			html = '<div class="menu-tree"><ul class="nav nav-sidebar flex-column">' + html + '</ul></div>';
		}

		return {
			html: html,
			has_active_child: has_active_child
		};
	}
});
