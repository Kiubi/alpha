var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var AutocompleteView = require('kiubi/views/ui/select.search.js');
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
		this.products.fetch({
			data: {
				limit: 5,
				term: term
			}
		}).done(function() {
			var results = _.map(this.products.toJSON(), function(product) {
				return {
					label: product.name,
					value: product.product_id
				};
			});

			// TODO : exclude current des results
			view.showResults(results);
		}.bind(this));
	},

	onChildviewChange: function(selected, view) {
		this.linked_product_id = selected.value;
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var data = Forms.extractFields(['link'], this);
		data.product_id = this.collection.product_id;
		data.linked_product_id = this.linked_product_id;

		var m = new this.collection.model({
			linked_product_id: data.linked_product_id
		});
		return m.save(data)
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(xhr) {
				Forms.displayErrors(xhr, this.getUI('errors'), this.el);
			}.bind(this));
	},

	onActionShow: function() {
		this.getUI('form').show();
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

	onLinkChange: function(event) {
		this.model.save({
			link: this.getUI('link').val()
		});
	},

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/views/ui/list.js');

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
		});
	}

});
