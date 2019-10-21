var Backbone = require('backbone');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var Folder = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/media/folders',

	idAttribute: 'folder_id',

	defaults: {
		folder_id: null,
		name: '',
		folder_key: '',
		parent_folder_id: 0,
		is_bookmarked: false,
		has_restrictions: false,
		restrictions: []
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/media/folders',
	model: Folder,

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
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;

		return this.fetch({
			data: {
				extra_fields: 'recursive'
			}
		}).then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];
			var tree = {};

			that.each(function(model) {
				var indent = 1;
				if (model.get('parent_folder_id') > 0) {
					indent = 1 + tree['p' + model.get('parent_folder_id')];
				}

				tree['p' + model.get('folder_id')] = indent;

				var item = {
					'value': model.get('folder_id'),
					'label': model.get('name'),
					'indent': indent,
					'selected': selected && model.get('folder_id') == selected
				};

				collector.push(item);
			});

			c.add(collector);

			return c;
		});
	}

});
