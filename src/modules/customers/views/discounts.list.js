var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var AutocompleteView = require('kiubi/views/ui/select.search.js');
var format = require('kiubi/utils/format.js');

var Categories = require('kiubi/modules/catalog/models/categories');
var CategCollection = new Categories();

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var RowView = Marionette.View.extend({
	template: require('../templates/discounts.row.html'),
	className: 'list-item list-item-form',

	behaviors: [RowActionsBehavior],

	ui: {
		'discount': 'input[name="discount_c"]'
	},

	regions: {
		autocomplete: {
			el: "div[data-role='autocomplete']",
			replaceElement: true
		}
	},

	templateContext: function() {
		return {
			'discount': format.formatFloat(this.model.get('discount')),
			'group_discount': format.formatFloat(this.model.get('group_discount'))
		};
	},

	onRender: function() {
		this.showChildView('autocomplete', new AutocompleteView({
			searchPlaceholder: 'Rechercher une catégorie',
			current: {
				label: this.model.get('category_name'),
				value: this.model.get('category_id')
			}
		}));
	},

	onActionDelete: function() {
		this.model.destroy();
	},

	onChildviewInput: function(term, view) {
		CategCollection.suggest(term, 5, [view.current.value]).done(function(categories) {
			var results = _.map(categories, function(categ) {
				return {
					label: categ.name,
					value: categ.category_id
				};
			});
			view.showResults(results);
		});
	},

	onChildviewChange: function(selected) {
		this.model.set('category_id', selected.value, {
			silent: true
		}); // do not render row
	}

});

var EmptyView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Aucune remise</span>'
	)
});

module.exports = Marionette.CollectionView.extend({
	className: '',
	emptyView: EmptyView,
	childView: RowView
});
