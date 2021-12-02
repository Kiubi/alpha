//var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var MenuTreeView = require('kiubi/core/views/ui/menuTreeView.js');

var Folders = require('../models/folders');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'media',
	behaviors: [ActiveLinksBehaviors],

	regions: {
		tree: {
			el: "div[data-role='tree']",
			replaceElement: true
		}
	},

	folder_id: -1,
	treeView: null,

	initialize: function(options) {
		this.collection = new Folders();

		this.folder_id = -1;

		this.treeView = new MenuTreeView({
			nodeInfo: this.nodeInfo.bind(this)
		});

		this.fetchAndRender();
	},

	onChangeFolder: function(folder_id) {
		if (this.folder_id == folder_id) return;
		this.folder_id = folder_id;
		this.render();
	},

	onRefreshFolders: function() {
		this.fetchAndRender();
	},

	fetchAndRender: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'recursive'
			}
		}).done(function() {
			this.render();
		}.bind(this));
	},

	onBeforeRender: function() {
		if (this.treeView.isAttached()) this.detachChildView('tree', this.treeView);
	},

	onRender: function() {
		if (this.collection.length === 0) return;

		this.showChildView('tree', this.treeView);
		this.treeView.setTree(this.collection.getMenuTree())
	},

	nodeInfo: function(model) {
		return {
			url: '/media/folders/' + model.get('folder_id') + '/files',
			name: model.get('name'),
			is_active: model.get('folder_id') == this.folder_id,
			extraClassname: (model.get('has_restrictions')) ? ' pagetype-extranet' : ''
		};
	}

});
