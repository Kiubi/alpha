var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/media/folders',
	model: require('./folder'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 * Return a menu tree from the current collection
	 *
	 * @return {Object}
	 */
	getMenuTree: function() {

		var root = {
			model: null,
			childs: []
		};
		var fastHash = {};

		this.each(function(folder) {
			var node = {
				model: folder,
				childs: []
			};
			fastHash['i' + folder.get('folder_id')] = node;
			var parent;
			if (folder.get('parent_folder_id') == 0) {
				parent = root;
			} else {
				parent = fastHash['i' + folder.get('parent_folder_id')];
			}
			parent.childs.push(node);
		});

		return root;
	},

	selectPayload: function() {
		var collector = [];
		var filter = this.selectPayloadFilter;

		var tree = {};

		this.each(function(folder) {
			var indent = 1;
			if (folder.get('parent_folder_id') > 0) {
				indent = 1 + tree['p' + folder.get('parent_folder_id')];
			}

			tree['p' + folder.get('folder_id')] = indent;

			var item = {
				'value': folder.get('folder_id'),
				'label': folder.get('name'),
				'indent': indent
			};

			collector.push(item);
		});

		return collector;
	}

});
