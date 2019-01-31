var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var PopoverBehavior = require('kiubi/behaviors/popover.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/products.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
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
		this.mergeOptions(options, ['collection', 'categories', 'tags', 'category_id', 'brands']);

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
		filters.push({
			id: 'term',
			title: 'Rechercher',
			type: 'input',
			value: this.filters.term
		});
		filters.push({
			id: 'add',
			title: 'Ajouter un filtre',
			extraClassname: 'filter-add',
			type: 'dropdown',
			disableLabelUpdate: true,
			collectionPromise: new CollectionUtils.SelectCollection([{
				'value': 'stock',
				'label': 'Stock'
			}, {
				'value': 'tag',
				'label': 'Tag'
			}, {
				'value': 'price',
				'label': 'Prix'
			}, {
				'value': 'weight',
				'label': 'Poids'
			}, {
				'value': 'available',
				'label': 'Disponibilité'
			}, {
				'value': 'visible',
				'label': 'Visibilité'
			}, {
				'value': 'spotlight',
				'label': 'Produit vedette'
			}, {
				'value': 'type',
				'label': 'Type'
			}, {
				'value': 'name',
				'label': 'Intitulé de variante'
			}, {
				'value': 'reference',
				'label': 'Référence de variante'
			}, {
				'value': 'linked',
				'label': 'Nb produits associés'
			}, {
				'value': 'rate',
				'label': 'Note'
			}, {
				'value': 'comments',
				'label': 'Nb de commentaires'
			}, {
				'value': 'brand',
				'label': 'Marque'
			}, {
				'value': 'condition',
				'label': 'État'
			}, {
				'value': 'gtin',
				'label': 'Code barre de variante'
			}])
		});

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des produits',
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
			filters: filters,
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export',
					'label': 'Exporter les produits',
					'selected': false
				}])
			}, {
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Produit',
					selected: true,
					value: 'name'
				}, {
					label: 'Prix minimum',
					selected: false,
					value: 'price_min'
				}, {
					label: 'Prix maximum',
					selected: false,
					value: '-price_max'
				}, {
					label: 'Modification',
					selected: false,
					value: '-modification'
				}])
			}]
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
		// additionals
		if (this.filters.price != null) {
			data.price_min = this.filters.price[0];
			data.price_max = this.filters.price[1];
		}
		if (this.filters.weight != null) {
			data.weight_min = this.filters.weight[0];
			data.weight_max = this.filters.weight[1];
		}
		if (this.filters.available != null) {
			data.available_date_min = this.filters.available[0];
			data.available_date_max = this.filters.available[1];
		}
		if (this.filters.is_visible != null) data.is_visible = this.filters.is_visible;
		if (this.filters.is_spotlight != null) data.is_spotlight = this.filters.is_spotlight;
		if (this.filters.type != null) data.type = this.filters.type;
		if (this.filters.variant_name != null) data.variant_name = this.filters.variant_name;
		if (this.filters.variant_reference != null) data.variant_reference = this.filters.variant_reference;
		if (this.filters.variant_condition != null) data.variant_condition = this.filters.variant_condition;
		if (this.filters.variant_gtin != null) data.variant_gtin = this.filters.variant_gtin;
		if (this.filters.linked != null) {
			data.linked_count_min = this.filters.linked[0];
			data.linked_count_max = this.filters.linked[1];
		}
		if (this.filters.rate != null) {
			data.rate_min = this.filters.rate[0];
			data.rate_max = this.filters.rate[1];
		}
		if (this.filters.comments != null) {
			data.comments_min = this.filters.comments[0];
			data.comments_max = this.filters.comments[1];
		}
		if (this.filters.brand != null) data.brand_id = this.filters.brand;

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
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
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
			if (this.filters.price != null) {
				data.price_min = this.filters.price[0];
				data.price_max = this.filters.price[1];
			}
			if (this.filters.weight != null) {
				data.weight_min = this.filters.weight[0];
				data.weight_max = this.filters.weight[1];
			}
			if (this.filters.available != null) {
				data.available_date_min = this.filters.available[0];
				data.available_date_max = this.filters.available[1];
			}
			if (this.filters.is_visible != null) data.is_visible = this.filters.is_visible;
			if (this.filters.is_spotlight != null) data.is_spotlight = this.filters.is_spotlight;
			if (this.filters.type != null) data.type = this.filters.type;
			if (this.filters.variant_name != null) data.variant_name = this.filters.variant_name;
			if (this.filters.variant_reference != null) data.variant_reference = this.filters.variant_reference;
			if (this.filters.variant_condition != null) data.variant_condition = this.filters.variant_condition;
			if (this.filters.variant_gtin != null) data.variant_gtin = this.filters.variant_gtin;
			if (this.filters.linked != null) {
				data.linked_count_min = this.filters.linked[0];
				data.linked_count_max = this.filters.linked[1];
			}
			if (this.filters.rate != null) {
				data.rate_min = this.filters.rate[0];
				data.rate_max = this.filters.rate[1];
			}
			if (this.filters.comments != null) {
				data.comments_min = this.filters.comments[0];
				data.comments_max = this.filters.comments[1];
			}
			if (this.filters.brand != null) data.brand_id = this.filters.brand;

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

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	},

	onPriceFilterChange: function(filter) {
		this.filters.price = filter.value;
		this.start();
	},

	onWeightFilterChange: function(filter) {
		this.filters.weight = filter.value;
		this.start();
	},

	onAvailableFilterChange: function(filter) {
		this.filters.available = filter.value;
		this.start();
	},

	onVisibleFilterChange: function(filter) {
		this.filters.is_visible = filter.value;
		this.start();
	},

	onSpotlightFilterChange: function(filter) {
		this.filters.is_spotlight = filter.value;
		this.start();
	},

	onTypeFilterChange: function(filter) {
		this.filters.type = filter.value;
		this.start();
	},

	onNameFilterChange: function(filter) {
		this.filters.variant_name = filter.value;
		this.start();
	},

	onReferenceFilterChange: function(filter) {
		this.filters.variant_reference = filter.value;
		this.start();
	},

	onLinkedFilterChange: function(filter) {
		this.filters.linked = filter.value;
		this.start();
	},

	onRateFilterChange: function(filter) {
		this.filters.rate = filter.value;
		this.start();
	},

	onCommentsFilterChange: function(filter) {
		this.filters.comments = filter.value;
		this.start();
	},

	onBrandFilterChange: function(filter) {
		this.filters.brand = filter.value;
		this.start();
	},

	onConditionFilterChange: function(filter) {
		this.filters.variant_condition = filter.value;
		this.start();
	},

	onGtinFilterChange: function(filter) {
		this.filters.variant_gtin = filter.value;
		this.start();
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
			return;
		}

		if (filter.model.get('id') == 'tag') {
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
			return;
		}

		if (filter.model.get('id') == 'brand') {
			this.brands.suggest(filter.value, 5).done(function(brands) {
				var results = _.map(brands, function(brand) {
					return {
						label: brand.name,
						value: brand.brand_id
					};
				});

				filter.view.showResults(results);
			}.bind(this));
			return;
		}

	},

	onAddFilterChange: function(filter) {

		var cfg;
		switch (filter.value) {
			case 'tag':
				cfg = {
					id: filter.value,
					title: 'Tous les tags',
					type: 'search',
					canDelete: true
				};
				break;
			case 'stock':
				cfg = {
					id: filter.value,
					title: 'Tous les états',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
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
					])
				};
				break;
			case 'price':
				cfg = {
					id: filter.value,
					title: 'prix HT',
					type: 'interval',
					prependText: ['Coûte entre', 'et'],
					canDelete: true
				};
				break;
			case 'weight':
				cfg = {
					id: filter.value,
					title: 'grammes',
					type: 'interval',
					prependText: ['Pèse entre', 'et'],
					canDelete: true
				};
				break;
			case 'available':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Disponible entre', 'et'],
					canDelete: true
				};
				break;
			case 'visible':
				cfg = {
					id: filter.value,
					title: 'Visibilité',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': true,
						'label': 'Affiché'
					}, {
						'value': false,
						'label': 'Masqué'
					}])
				};
				break;
			case 'spotlight':
				cfg = {
					id: filter.value,
					title: 'Produit vedette',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': true,
						'label': 'Mis en avant'
					}, {
						'value': false,
						'label': 'Pas mis en avant'
					}])
				};
				break;
			case 'type':
				var p = new this.collection.model();
				cfg = {
					id: filter.value,
					title: 'Type',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: p.getTypes().then(function(types) {
						return new CollectionUtils.SelectCollection(
							_.map(types, function(type) {
								return {
									value: type.type,
									label: type.name
								};
							})
						);
					})
				};
				break;
			case 'name':
				cfg = {
					id: filter.value,
					title: 'Intitulé de la variante',
					type: 'input',
					value: '',
					canDelete: true
				};
				break;
			case 'reference':
				cfg = {
					id: filter.value,
					title: 'Référence de la variante',
					type: 'input',
					value: '',
					canDelete: true
				};
				break;
			case 'linked':
				cfg = {
					id: filter.value,
					title: 'nb produits',
					type: 'interval',
					prependText: ['Associé à entre', 'et'],
					canDelete: true
				};
				break;
			case 'rate':
				cfg = {
					id: filter.value,
					title: 'de 0 à 10',
					type: 'interval',
					prependText: ['Noté entre', 'et'],
					canDelete: true
				};
				break;
			case 'comments':
				cfg = {
					id: filter.value,
					title: 'nb de fois',
					type: 'interval',
					prependText: ['Commenté entre', 'et'],
					canDelete: true
				};
				break;
			case 'brand':
				cfg = {
					id: filter.value,
					title: 'Marque',
					type: 'search',
					canDelete: true
				};
				break;
			case 'condition':
				cfg = {
					id: filter.value,
					title: 'État',
					type: 'dropdown',
					canDelete: true,
					collectionPromise: new CollectionUtils.SelectCollection([{
						'value': 'new',
						'label': 'Neuf'
					}, {
						'value': 'used',
						'label': 'Occasion'
					}, {
						'value': 'refurbished',
						'label': 'Reconditionné'
					}])
				};
				break;
			case 'gtin':
				cfg = {
					id: filter.value,
					title: 'Code barre',
					type: 'input',
					value: '',
					canDelete: true
				};
				break;
			default:
				return;
		}

		filter.model.collection.add(cfg);
	}

});
