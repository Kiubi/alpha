var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
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
			preview: Session.site.get('domain') + '/catalogue/' + this.model.get('slug') + '.html',
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

	category_id: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'category_id']);
	},

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des produits',
			order: [{
				title: 'Produit',
				is_active: true,
				data: {
					sort: 'name',
					category_id: this.category_id,
					extra_fields: 'price_label,categories'
				}
			}, {
				title: 'Prix minimum',
				is_active: false,
				data: {
					sort: 'price_min',
					category_id: this.category_id,
					extra_fields: 'price_label,categories'
				}
			}, {
				title: 'Prix maximum',
				is_active: false,
				data: {
					sort: '-price_max',
					category_id: this.category_id,
					extra_fields: 'price_label,categories'
				}
			}],
			//filterModal: '#filterscatalog',
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
			}]
			/*,
						filters: [{
							selectExtraClassname: 'select-category',
							title: 'Catégories',
							collection: this.getOption('categories'),
							selected: this.collection.category_id
						}]*/
		}));
	},

	start: function() {
		var data = {
			extra_fields: 'price_label,categories'
		};
		if (this.category_id) data.category_id = this.category_id;
		this.collection.fetch({
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
	}

	/*onChildviewFilterChange: function(filter) {
		// Only one filter, so assume it is the category filter
		if (filter.value) {
			if (this.collection.category_id == filter.value) return;
			this.collection.category_id = filter.value;
		} else {
			if (this.collection.category_id == null) return;
			this.collection.category_id = null;
		}
		this.collection.fetch();
	}*/

});
