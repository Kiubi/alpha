var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var AutocompleteView = require('kiubi/core/views/ui/select.search.js');
var PopoverBehavior = require('kiubi/behaviors/popover.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');
var Forms = require('kiubi/utils/forms.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/linked.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior, SelectifyBehavior],

	regions: {
		'product': {
			el: "div[data-role='product']",
			replaceElement: true
		}
	},

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]'
	},

	initialize: function(options) {
		this.products = options.products;
	},

	onRender: function() {
		this.showChildView('product', new AutocompleteView({
			searchPlaceholder: 'Rechercher un produit'
		}));
	},

	onChildviewInput: function(term, view) {

		var exclude = this.collection.pluck('linked_product_id');
		exclude.push(this.collection.product_id);

		this.products.suggest(term, 5, exclude).done(function(suggestions) {
			var results = _.map(suggestions, function(product) {
				return {
					label: product.name,
					value: product.product_id
				};
			});
			view.showResults(results);
		});
	},

	onChildviewChange: function(selected, view) {
		this.linked_product_id = selected.value;
	},

	onActionSave: function() {

		var data = Forms.extractFields(['link'], this);
		data.product_id = this.collection.product_id;
		data.linked_product_id = this.linked_product_id;

		var m = new this.collection.model({
			linked_product_id: data.linked_product_id
		});

		this.getChildView('product').clear();

		return m.save(data)
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/linked.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior, SelectifyBehavior, PopoverBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'link': 'select'
	},

	events: {
		'change @ui.link': 'onLinkChange'
	},

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

	onLinkChange: function(event) {
		this.model.save({
			link: this.getUI('link').val()
		});
	},

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/linked.html'),
	className: 'container',
	service: 'catalog',

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'products']);
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
			newRowView: NewRowView,

			title: 'Produits associés',
			childViewOptions: {
				products: this.products
			}
		}));
	},

	start: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'categories'
			}
		}).done(function() {
			// restore product_id for each link
			this.collection.each(function(model) {
				model.set('product_id', model.collection.product_id);
			});
		}.bind(this));
	}

});
