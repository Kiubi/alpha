var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/posts.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return (nb > 1 ? plural : singular).replace('%d', nb);
			},
			publication_date: format.formatLongDateTime(this.model.get('publication_date')),
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/posts.html'),
	className: 'container-fluid',
	service: 'blog',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-publication',
	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.filters = {
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null,
			category_id: this.getOption('filters') && this.getOption('filters').category_id ? this.getOption('filters').category_id : null
		};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des billets',
			selection: [{
				title: 'Afficher',
				callback: this.showPosts.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hidePosts.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deletePosts.bind(this),
				confirm: true
			}],
			filters: [{
				id: 'category',
				extraClassname: 'select-category',
				title: 'Toutes les catégories',
				collectionPromise: this.getOption('categories').promisedSelect(this.filters.category_id)
			}, {
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}, {
				id: 'add',
				title: 'Ajouter un filtre',
				extraClassname: 'filter-add',
				type: 'dropdown',
				disableLabelUpdate: true,
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'publication',
					'label': 'Publication'
				}, {
					'value': 'visible',
					'label': 'Visibilité'
				}, {
					'value': 'type',
					'label': 'Type'
				}, {
					'value': 'comments',
					'label': 'Nb de commentaires'
				}])
			}],
			xtra: [{
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Publication',
					selected: true,
					value: '-publication'
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
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.term != null) data.term = this.filters.term;
		if (this.filters.category_id != null) data.category_id = this.filters.category_id;
		if (this.filters.type != null) data.type = this.filters.type;
		if (this.filters.is_visible != null) data.is_visible = this.filters.is_visible;
		if (this.filters.publication != null) {
			data.publication_date_min = this.filters.publication[0];
			data.publication_date_max = this.filters.publication[1];
		}
		if (this.filters.comments != null) {
			data.comments_min = this.filters.comments[0];
			data.comments_max = this.filters.comments[1];
		}
		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	showPosts: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hidePosts: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids, 'delete');
	},

	/* Filers */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onCategoryFilterChange: function(filter) {
		this.filters.category_id = filter.value != '' ? filter.value : null;
		this.start();
	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();
	},

	onVisibleFilterChange: function(filter) {
		this.filters.is_visible = filter.value;
		this.start();
	},

	onTypeFilterChange: function(filter) {
		this.filters.type = filter.value;
		this.start();
	},

	onCommentsFilterChange: function(filter) {
		this.filters.comments = filter.value;
		this.start();
	},

	onPublicationFilterChange: function(filter) {
		this.filters.publication = filter.value;
		this.start();
	},

	onAddFilterChange: function(filter) {

		var cfg;
		switch (filter.value) {
			case 'publication':
				cfg = {
					id: filter.value,
					title: 'jj/mm/aaaa',
					type: 'interval',
					enableDatepicker: 'date',
					prependText: ['Publié entre', 'et'],
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
			case 'comments':
				cfg = {
					id: filter.value,
					title: 'nb de fois',
					type: 'interval',
					prependText: ['Commenté entre', 'et'],
					canDelete: true
				};
				break;
			default:
				return;
		}

		filter.model.collection.add(cfg);
	},

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	}

});
