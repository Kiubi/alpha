var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Symbol = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/symbols',
	idAttribute: 'symbol_id',

	defaults: {
		symbol_id: null,
		model: '',
		zones: null,
		params: null
	},

	getTitle: function() {
		return this.get('params') ? this.get('params').title : '';
	},

	getBackURL: function() {
		return '/cms/symbols/' + this.get('symbol_id');
	},

	/**
	 * Return all models
	 *
	 * @returns {Promise}
	 */
	getModels: function(options) {

		options = options || {};

		return Backbone.ajax({
			url: 'sites/@site/cms/symbols/models.json',
			data: options
		}).then(function(data, meta) {
			return _.map(data, function(model) {
				return {
					id: model.id,
					name: model.name,
					fields: model.fields || [],
					zones: model.zones || []
					// structure: model.structure
				};
			});
		});
	},

	/**
	 * Duplicate current symbol
	 *
	 * @return {Promise}
	 */
	duplicate: function() {
		var that = this;
		return Backbone.ajax({
			url: 'sites/@site/cms/symbols/' + this.get('symbol_id'),
			method: 'POST'
		}).then(function(data, meta) {
			var copy = that.clone();
			copy.set(copy.parse({
				data: data,
				meta: meta
			}));
			return copy;
		});
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({


	url: function() {
		return 'sites/@site/cms/symbols';
	},

	model: Symbol,

	getMenuTree: function() {

		var hashCategories = new Map();

		var root = this.reduce(function(acc, symbol) {

			var split = symbol.get('params').title.split('/');
			var category, title;
			if (split.length == 2) {
				category = split[0].trim();
				title = split[1].trim();
			} else {
				category = '';
				title = symbol.get('params').title;
			}

			if (category === '') {
				acc.childs.push({
					model: new Backbone.Model({
						id: symbol.get('symbol_id'),
						name: title,
						type: 'symbol'
					}),
					childs: []
				});
				return acc;
			}

			if (!hashCategories.has(category)) {
				hashCategories.set(category, acc.childs.length);
			}

			if (!acc.childs[hashCategories.get(category)]) {
				acc.childs[hashCategories.get(category)] = {
					model: new Backbone.Model({
						id: 'c' + hashCategories.get(category),
						name: category,
						type: 'category'
					}),
					childs: []
				}
			}

			acc.childs[hashCategories.get(category)].childs.push({
				model: new Backbone.Model({
					id: symbol.get('symbol_id'),
					name: title,
					type: 'symbol'
				}),
				childs: []
			});

			return acc;
		}, {
			model: new Backbone.Model({
				id: 0,
				name: '',
				type: 'category'
			}),
			childs: []
		});

		var sortFct = function(a, b) {
			if (a.childs.length === 0 && b.childs.length > 0) return -1;
			if (a.childs.length > 0 && b.childs.length === 0) return 1;
			return a.model.get('name') > b.model.get('name');
		};

		// Sorting root and 1st level childs
		root.childs.sort(sortFct);
		_.each(root.childs, function(node) {
			node.childs.sort(sortFct);
		});

		return root;
	}

});
