var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

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

var ListView = require('kiubi/views/ui/list.js');

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
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
		};
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des billets',
			order: [{
				title: 'Publication',
				is_active: true,
				value: '-publication'
			}, {
				title: 'Modification',
				is_active: false,
				value: '-modification'
			}],
			// TODO : filterModal: '#filtersblog',
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
				id: 'category_id',
				extraClassname: 'select-category',
				title: 'Toutes les catégories',
				collectionPromise: this.getOption('categories').promisedSelect(this.collection.category_id)
			}, {
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}]
		}));
	},

	start: function() {
		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.term != null) data.term = this.filters.term;

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
		return this.collection.bulkDelete(ids);
	},

	/* Filers */

	onChildviewFilterChange: function(filter) {

		switch (filter.model.get('id')) {
			case 'category_id':
				// Only one filter, so assume it is the category filter
				if (filter.value) {
					if (this.collection.category_id == filter.value) return;
					this.collection.category_id = filter.value;
				} else {
					if (this.collection.category_id == null) return;
					this.collection.category_id = null;
				}
				break;
			case 'term':
				this.filters.term = filter.value != '' ? filter.value : null;
				break;
		}
		this.start();
	},

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	}

});
