var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Page = require('./page');
var Pages = Backbone.Collection;
var Menu = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/menus',
	idAttribute: 'menu_id',

	defaults: {
		menu_id: null,
		name: '',
		is_main: false,
		api_key: '',
		pages: []
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/cms/menus',

	model: Menu,
	parse: function(response) {
		this.meta = response.meta;

		_.each(response.data, function(menu) {
			var collection = [];
			if (menu.pages) {
				_.each(menu.pages, function(page) {
					collection.push(new Page(page));
				});
			}
			menu.pages = new Pages(collection);

		});

		return response.data;
	},

	selectPayloadFilter: null,

	selectPayload: function() {

		var collector = [];
		var filter = this.selectPayloadFilter;

		_.each(this.toJSON(), function(item) {

			if (item.pages) {

				var tree = {};

				var insertItem = {
					'value': 'm' + item.menu_id,
					'label': item.name,
					'is_root': true,
					'indent': 0
				};
				if (filter) {
					insertItem = filter(insertItem, null);
				}
				if (insertItem !== false) collector.push(insertItem);

				_.each(item.pages.toJSON(), function(page) {

					var indent = 1;
					if (page.page_parent_id > 0) {
						indent = 1 + tree['p' + page.page_parent_id];
					}

					tree['p' + page.page_id] = indent;

					var item = {
						'value': page.page_id,
						'label': page.name,
						'indent': indent
					};

					if (filter) item = filter(item, page);
					if (item !== false) collector.push(item);
				});
			} else {
				collector.push({
					'value': item.menu_id,
					'label': item.name
				});
			}

		});

		return collector;
	},

	/**
	 * Find a page in current collection
	 * 
	 * @param {int} page_id
	 * @returns {Object}
	 */
	findPage: function(page_id) {
		var collector = null;

		_.each(this.toJSON(), function(item) {
			if (item.pages && collector == null) {
				_.each(item.pages.toJSON(), function(page) {
					if (page.page_id == page_id) {
						collector = page;
					}
				});
			}
		});

		return collector;
	},

	/**
	 * 
	 * @returns {Array}
	 */
	childPages: function(menu_id, parent_id) {

		var collector = [];

		_.each(this.toJSON(), function(item) {
			if (item.menu_id == menu_id && item.pages) {
				_.each(item.pages.toJSON(), function(page) {
					if (page.page_parent_id == parent_id && !page.is_home) {
						collector.push(page);
					}
				});
			}
		});

		return collector;
	},

	/**
	 * Return a menu tree from the current collection
	 * 
	 * @params {int} menu_id
	 * @return {Array}
	 */
	getMenuTree: function(menu_id) {

		if (this.length == 0) {
			return [];
		}

		var root = null;
		this.each(function(menu) {
			if (menu.get('menu_id') != menu_id) return;
			var fastHash = {};
			root = {
				menu_id: menu.get('menu_id'),
				model: null,
				childs: []
			};
			menu.get('pages').each(function(page) {
				var node = {
					model: page,
					childs: []
				};
				fastHash['i' + page.get('page_id')] = node;
				var parent;
				if (page.get('page_parent_id') == 0) {
					parent = root;
				} else {
					parent = fastHash['i' + page.get('page_parent_id')];
				}
				parent.childs.push(node);
			});
		});

		return root;
	},

	/**
	 * Return a list of potential parents from a page
	 *
	 * @param {Number} page_id
	 * @returns {Array}
	 */
	parentList: function(page_id) {

		var collector = [];
		var excludeList = [page_id];
		var maxIndent = 3;

		_.each(this.toJSON(), function(item) {

			if (item.pages) {

				var tree = {};

				var insertItem = {
					'value': 'm' + item.menu_id,
					'label': item.name,
					'indent': 0,
					'is_selectable': true,
					'is_positionnable': false
				};
				collector.push(insertItem);

				_.each(item.pages.toJSON(), function(page) {

					var indent = 1;
					if (page.page_parent_id > 0) {
						indent = 1 + tree['p' + page.page_parent_id];
					}

					tree['p' + page.page_id] = indent;

					if (page.is_home) return;

					if (excludeList.indexOf(page.page_id) >= 0) {
						return;
					}

					if (excludeList.indexOf(page.page_parent_id) >= 0) {
						excludeList.push(page.page_id);
						return;
					}

					var item = {
						'value': page.page_id,
						'label': page.name,
						'indent': indent,
						'is_selectable': (indent <= maxIndent),
						'is_positionnable': true
					};

					collector.push(item);
				});
			} else {
				collector.push({
					'value': item.menu_id,
					'label': item.name,
					'indent': 0,
					'is_selectable': true,
					'is_positionnable': false
				});
			}

		});

		return collector;
	},

	/**
	 * Suggest page
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/cms/pages',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(page) {
				return {
					page_id: page.page_id,
					is_home: page.is_home,
					name: page.name,
					slug: page.slug,
					page_type: page.page_type
				};
			});
		});
	},

});
