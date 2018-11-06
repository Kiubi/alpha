var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var AutocompleteView = require('kiubi/core/views/ui/select.search.js');
var Categories = require('kiubi/modules/catalog/models/categories');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');


var RowView = Marionette.View.extend({
	template: require('../templates/merchantcenter.row.html'),
	className: 'list-item list-item-form',

	behaviors: [RowActionsBehavior],

	regions: {
		catalog: {
			el: "div[data-role='catalog']",
			replaceElement: true
		},
		merchantcenter: {
			el: "div[data-role='merchantcenter']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['categories', 'merchantcenter']);
	},

	onRender: function() {
		this.showChildView('catalog', new AutocompleteView({
			searchPlaceholder: 'Rechercher une catégorie',
			current: {
				label: this.model.get('name'),
				value: this.model.get('category_id')
			},
			evtSuffix: 'catalog'
		}));
		this.showChildView('merchantcenter', new AutocompleteView({
			searchPlaceholder: 'Recherche sur Google Merchant Center',
			current: {
				label: this.model.get('mc_name'),
				value: this.model.get('mc_category_id')
			},
			evtSuffix: 'merchantcenter'
		}));
	},

	onActionDelete: function() {
		this.model.destroy();
	},

	// Catalog categories

	onChildviewInputCatalog: function(term, view) {
		var exclude = view.current.value ? [view.current.value] : null;
		this.categories.suggest(term, 5, exclude).done(function(categories) {
			var results = _.map(categories, function(categ) {
				return {
					label: categ.name,
					value: categ.category_id
				};
			});
			view.showResults(results);
		}.bind(this));
	},

	onChildviewChangeCatalog: function(selected) {
		this.model.set('category_id', selected.value, {
			silent: true
		}); // do not render row*/
	},

	// Catalog categories

	onChildviewInputMerchantcenter: function(term, view) {
		this.merchantcenter.searchCategories(term).done(function(categories) {
			var results = _.map(categories, function(categ) {
				return {
					label: categ.name,
					value: categ.category_id
				};
			});

			// TODO : exclude current
			view.showResults(results);
		});
	},

	onChildviewChangeMerchantcenter: function(selected) {
		this.model.set('mc_category_id', selected.value, {
			silent: true
		}); // do not render row*/
	}

});

var EmptyView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Aucune catégorie</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: '',
	emptyView: EmptyView,
	childView: RowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/merchantcenter.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	regions: {
		categories: {
			el: "div[data-role='categories']",
			replaceElement: true
		}
	},

	ui: {
		'addDiscountBtn': 'a[data-role="categ-add"]'
	},

	events: {
		'click @ui.addDiscountBtn': function() {
			var m = new this.mapping.model({
				category_id: null,
				name: '-- Choisir une catégorie --',
				mc_category_id: null,
				mc_name: '-- Choisir une catégorie --'
			});
			this.mapping.add(m);
		}
	},

	fields: [
		'is_enabled'
	],

	mapping: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
		this.mapping = new Backbone.Collection();
		this.mapping.add(this.model.get('categories'));
	},

	templateContext: function() {
		return {
			last_export: this.model.get('last_export') ? format.formatDateTime(this.model.get('last_export')) : null
		};
	},

	onRender: function() {
		this.showChildView('categories', new ListView({
			collection: this.mapping,
			childViewOptions: {
				categories: new Categories(),
				merchantcenter: this.model
			}
		}));
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		if (this.mapping.length == 0) {
			data.categories = ['']; // HACK : force empty array
		} else {
			data.categories = this.mapping.reduce(function(memo, model) {
				memo.push({
					category_id: model.get('category_id'),
					mc_category_id: model.get('mc_category_id')
				});
				return memo;
			}, []);
		}

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	}

});
