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
			sec_categories: _.reduce(this.model.get('categories'), function(acc, category) {
				if (!category.is_main) {
					// category.name need double escaping
					acc.push('<a href="/catalog/categories/' + category.category_id + '">' + _.escape(category.name) +
						'</a><br/>');
				}
				return acc;
			}, [])
		};
	},

	behaviors: [RowActionsBehavior, PopoverBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

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

		var stock = this.getOption('filters') && this.getOption('filters').stock ? this.getOption('filters').stock : null;
		if (stock != 'yes' && stock != 'partial' && stock != 'no') {
			stock = null;
		}
		this.filters = {
			stock: stock,
			category_id: null,
			tag_id: null,
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
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
			title: 'Tous les états',
			collectionPromise: c
		});
		filters.push({
			id: 'term',
			title: 'Rechercher',
			type: 'input',
			value: this.filters.term
		});
		filters.push({
			id: 'export',
			extraClassname: 'md-export',
			type: 'button',
			collectionPromise: new CollectionUtils.SelectCollection([{
				'value': 'export',
				'label': 'Exporter les produits',
				'selected': false
			}])
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
		if (this.filters.term != null) data.term = this.filters.term;
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

	/* Filters */

	onChildviewFilterChange: function(filter) {
		switch (filter.model.get('id')) {
			case 'term':
				this.onTermFilterChange(filter);
				break;
			case 'categories':
				this.onCategoriesFilterChange(filter);
				break;
			case 'tag':
				this.onTagFilterChange(filter);
				break;
			case 'stock':
				this.onStockFilterChange(filter);
				break;
			case 'export':
				this.onExportFilterChange(filter);
				break;
		}

	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();

	},

	onCategoriesFilterChange: function(filter) {
		this.filters.category_id = filter.value;
		this.start();

	},

	onTagFilterChange: function(filter) {
		this.filters.tag_id = filter.value;
		this.start();

	},

	onStockFilterChange: function(filter) {
		if (filter.value == 'yes') {
			this.filters.stock = 'yes';
		} else if (filter.value == 'no') {
			this.filters.stock = 'no';
		} else if (filter.value == 'partial') {
			this.filters.stock = 'partial';
		} else {
			this.filters.stock = null;
		}
		this.start();

	},

	onExportFilterChange: function(filter) {
		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export') {

			if (view.collection.length > 1) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {};
			if (this.filters.category_id != null) data.category_id = this.filters.category_id;
			if (this.filters.tag_id != null) data.tag_id = this.filters.tag_id;
			if (this.filters.stock != null) data.stock = this.filters.stock;
			if (this.filters.term != null) data.term = this.filters.term;

			this.collection.exportAll(data).done(function(data) {
				view.overrideExtraClassname('');
				view.collection.add([{
					value: null,
					label: '---'
				}, {
					value: data.url,
					label: 'Télécharger le fichier',
					extraClassname: 'md-export'
				}]);
				view.toggleDropdown(); // open
			}.bind(this)).fail(function(xhr) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(xhr);

				view.overrideExtraClassname('');
				while (view.collection.length > 1) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 1) {
				view.collection.pop();
			}
		}
	},


	onChildviewFilterInput: function(filter) {

		if (!filter.view || !filter.view.showResults) return;


		if (filter.model.get('id') == 'categories') {
			var exclude = filter.view.current.value ? [filter.view.current.value] : null;
			this.categories.suggest(filter.value, 5, exclude).done(function(categories) {
				var results = _.map(categories, function(categ) {
					return {
						label: categ.name,
						value: categ.category_id
					};
				});

				filter.view.showResults(results);
			}.bind(this));
		} else {
			var exclude = filter.view.current.value ? [filter.view.current.value] : null;
			this.tags.suggest(filter.value, 5, exclude).done(function(tags) {
				var results = _.map(tags, function(tag) {
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
