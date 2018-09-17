var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var PopoverBehavior = require('kiubi/behaviors/popover.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/products.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return (nb > 1 ? plural : singular).replace('%d', nb);
			},
			convertMediaPath: Session.convertMediaPath.bind(Session),
			main_category: _.find(this.model.get('categories'), function(category) {
				return category.is_main;
			}),
			sec_categories: _.filter(this.model.get('categories'), function(category) {
				return !category.is_main;
			})
		};
	},

	behaviors: [RowActionsBehavior, PopoverBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/products.html'),
	className: 'container-fluid',
	service: 'catalog',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	category_id: null,
	sortOrder: 'name',
	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'categories', 'tags', 'category_id']);
		this.filters = {
			stock: null,
			category_id: null,
			tag_id: null
		};
	},

	onRender: function() {


		var filters = [];
		if (this.category_id == null) {
			filters.push({
				id: 'categories',
				title: 'Toutes les catégories',
				type: 'search'
			});
		}
		var c = new CollectionUtils.SelectCollection();
		c.add([{
				'value': 'yes',
				'label': 'En stock',
				'selected': this.filters.stock == 'yes'
			},
			{
				'value': 'partial',
				'label': 'En rupture partielle',
				'selected': this.filters.stock == 'partial'
			}, {
				'value': 'no',
				'label': 'En rupture totale',
				'selected': this.filters.stock == 'no'
			}
		]);
		filters.push({
			id: 'tag',
			title: 'Tous les tags',
			type: 'search'
		});
		filters.push({
			id: 'stock',
			extraClassname: 'select-state',
			title: 'États',
			collectionPromise: c
		});

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des produits',
			order: [{
				title: 'Produit',
				is_active: true,
				value: 'name'
			}, {
				title: 'Prix minimum',
				is_active: false,
				value: 'price_min'
			}, {
				title: 'Prix maximum',
				is_active: false,
				value: '-price_max'
			}],
			// filterModal: '#filterscatalog',
			selection: [{
				title: 'Afficher',
				callback: this.showProducts.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideProducts.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteProducts.bind(this),
				confirm: true
			}],
			filters: filters
		}));
	},

	start: function() {
		var data = {
			extra_fields: 'price_label,categories',
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.category_id) data.category_id = this.category_id;
		if (this.filters.stock != null) data.stock = this.filters.stock;
		if (this.filters.category_id != null) data.category_id = this.filters.category_id;
		if (this.filters.tag_id != null) data.tag_id = this.filters.tag_id;
		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	showProducts: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hideProducts: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deleteProducts: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewFilterChange: function(filter) {
		if (filter.model.get('id') == 'categories') {
			this.filters.category_id = filter.value;
		} else if (filter.model.get('id') == 'tag') {
			this.filters.tag_id = filter.value;
		} else if (filter.model.get('id') == 'stock') {
			if (filter.value == 'yes') {
				this.filters.stock = 'yes';
			} else if (filter.value == 'no') {
				this.filters.stock = 'no';
			} else if (filter.value == 'partial') {
				this.filters.stock = 'partial';
			} else {
				this.filters.stock = null;
			}
		}

		this.start();
	},

	onChildviewFilterInput: function(filter) {

		if (!filter.view || !filter.view.showResults) return;


		if (filter.model.get('id') == 'categories') {

			this.categories.fetch({
				data: {
					limit: 5,
					term: filter.value
				}
			}).done(function() {
				var results = _.map(this.categories.toJSON(), function(categ) {
					return {
						label: categ.name,
						value: categ.category_id
					};
				});

				filter.view.showResults(results);
			}.bind(this));
		} else {
			this.tags.fetch({
				data: {
					limit: 5,
					term: filter.value
				}
			}).done(function() {
				var results = _.map(this.tags.toJSON(), function(tag) {
					return {
						label: tag.name,
						value: tag.tag_id
					};
				});

				filter.view.showResults(results);
			}.bind(this));
		}

	},

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	}

});
