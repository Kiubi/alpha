var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var TagView = require('kiubi/views/ui/tag.search.js');
var SelectView = require('kiubi/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format');
var Datepicker = require('kiubi/behaviors/datepicker.js');

var Restrictions = require('kiubi/modules/customers/models/restrictions');

/**
 *
 * @param {Object[]} customers
 * @param {Object[]} groups
 * @returns {Array}
 */
function formatCustomersTags(customers, groups) {
	return _.map(groups, function(r) {
		return {
			label: 'Groupe : ' + r.name,
			value: r.restriction_id,
			type: 'group'
		};
	}).concat(_.map(customers, function(r) {
		return {
			label: r.name,
			value: r.restriction_id,
			type: 'customer'
		};
	}));
}

/**
 *
 * @param {Object[]} products
 * @param {Object[]} categories
 * @returns {Array}
 */
function formatProductsTags(products, categories) {
	return _.map(categories, function(r) {
		return {
			label: 'Catégorie : ' + r.name,
			value: r.restriction_id,
			type: 'category'
		};
	}).concat(_.map(products, function(r) {
		return {
			label: r.name,
			value: r.restriction_id,
			type: 'product'
		};
	}));
}

module.exports = Marionette.View.extend({
	template: require('../templates/voucher.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior, Datepicker],

	regions: {
		carriers: {
			el: "div[data-role='carriers']",
			replaceElement: true
		},

		allowed_customers: {
			el: "div[data-role='allowed_customers']",
			replaceElement: true
		},
		denied_customers: {
			el: "div[data-role='denied_customers']",
			replaceElement: true
		},

		allowed_products: {
			el: "div[data-role='allowed_products']",
			replaceElement: true
		},
		denied_products: {
			el: "div[data-role='denied_products']",
			replaceElement: true
		}
	},

	ui: {
		'stock_fields': 'div[data-role="stock"]',
		'is_stock_unlimited': 'select[name="is_stock_unlimited"]',

		'quota_fields': 'div[data-role="quota"]',
		'is_quota_unlimited': 'select[name="is_quota_unlimited"]'
	},

	events: {
		'change @ui.is_stock_unlimited': function(event) {
			if (this.getUI('is_stock_unlimited').val() == '1') {
				this.getUI('stock_fields').hide();
			} else {
				this.getUI('stock_fields').show();
			}
		},
		'change @ui.is_quota_unlimited': function(event) {
			if (this.getUI('is_quota_unlimited').val() == '1') {
				this.getUI('quota_fields').hide();
			} else {
				this.getUI('quota_fields').show();
			}
		}
	},

	fields: [
		"code",
		"value",
		"start_date",
		"end_date",
		"is_enabled",
		"stock",
		"is_stock_unlimited",
		"quota",
		"is_quota_unlimited",
		"threshold",
		"carrier_id"
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'customers', 'groups', 'categories', 'products', 'carriers']);
	},

	templateContext: function() {
		return {
			start_date: format.formatDate(this.model.get('start_date')),
			end_date: format.formatDate(this.model.get('end_date'))
		};
	},

	onRender: function() {

		var restrictions = this.model.get('restrictions');

		// Allowed customers & groups
		this.showChildView('allowed_customers', new TagView({
			evtSuffix: 'customers',
			searchPlaceholder: 'Recherche des membres ou groups extranet',
			tags: formatCustomersTags(restrictions.allow.customers, restrictions.allow.groups)
		}));

		// Denied customers & groups
		this.showChildView('denied_customers', new TagView({
			evtSuffix: 'customers',
			searchPlaceholder: 'Recherche des membres ou groups extranet',
			tags: formatCustomersTags(restrictions.deny.customers, restrictions.deny.groups)
		}));

		if (this.model.get('type') != 'shipping') {
			// Allowed products & categories
			this.showChildView('allowed_products', new TagView({
				evtSuffix: 'products',
				searchPlaceholder: 'Recherche des produits ou catégories de produits',
				tags: formatProductsTags(restrictions.allow.products, restrictions.allow.categories)
			}));

			// Denied products & categories
			this.showChildView('denied_products', new TagView({
				evtSuffix: 'products',
				searchPlaceholder: 'Recherche des produits ou catégories de produits',
				tags: formatProductsTags(restrictions.deny.products, restrictions.deny.categories)
			}));
		} else {
			this.showChildView('carriers', new SelectView({
				collectionPromise: this.carriers.promisedSelect({
					exclude_pickup: true
				}, this.model.get('carrier_id')),
				name: 'carrier_id'
			}));
		}
	},

	// Allow - Deny Customers & Groups
	onChildviewInputCustomers: function(term, view) {

		Backbone.$.when(
			this.customers.fetch({
				data: {
					limit: 5,
					term: term
				}
			}),
			this.groups.fetch({
				data: {
					limit: 5,
					term: term
				}
			})
		).done(function() {

			view.showResults(formatCustomersTags(_.map(this.customers.toJSON(), function(r) {
				return {
					name: r.firstname + ' ' + r.lastname,
					restriction_id: r.customer_id
				};
			}), _.map(this.groups.toJSON(), function(r) {
				return {
					name: r.name,
					restriction_id: r.group_id
				};
			})));

		}.bind(this));
	},

	// Allow - Deny Products & Categories
	onChildviewInputProducts: function(term, view) {

		Backbone.$.when(
			this.products.fetch({
				data: {
					limit: 5,
					term: term
				}
			}),
			this.categories.fetch({
				data: {
					limit: 5,
					term: term
				}
			})
		).done(function() {

			view.showResults(formatProductsTags(_.map(this.products.toJSON(), function(r) {
				return {
					name: r.name,
					restriction_id: r.product_id
				};
			}), _.map(this.categories.toJSON(), function(r) {
				return {
					name: r.name,
					restriction_id: r.category_id
				};
			})));

		}.bind(this));
	},

	onSave: function() {

		var collection = new Restrictions();
		collection.setType('checkout/vouchers', this.model.get('voucher_id'));

		var allow_customers = [];
		var allow_groups = [];
		var allow_products = [];
		var allow_categories = [];

		var deny_customers = [];
		var deny_groups = [];
		var deny_products = [];
		var deny_categories = [];

		_.each(this.getChildView('allowed_customers').getTags(), function(t) {
			if (t.type == 'customer') {
				allow_customers.push(t.value);
			} else {
				allow_groups.push(t.value);
			}
		});
		_.each(this.getChildView('denied_customers').getTags(), function(t) {
			if (t.type == 'customer') {
				deny_customers.push(t.value);
			} else {
				deny_groups.push(t.value);
			}
		});

		if (this.model.get('type') != 'shipping') {
			_.each(this.getChildView('allowed_products').getTags(), function(t) {
				if (t.type == 'product') {
					allow_products.push(t.value);
				} else {
					allow_categories.push(t.value);
				}
			});
			_.each(this.getChildView('denied_products').getTags(), function(t) {
				if (t.type == 'product') {
					deny_products.push(t.value);
				} else {
					deny_categories.push(t.value);
				}
			});
		}

		collection.set('allow_customers', allow_customers);
		collection.set('allow_groups', allow_groups);
		collection.set('allow_products', allow_products);
		collection.set('allow_categories', allow_categories);

		collection.set('deny_customers', deny_customers);
		collection.set('deny_groups', deny_groups);
		collection.set('deny_products', deny_products);
		collection.set('deny_categories', deny_categories);

		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		).then(function() {
			return collection.save();
		});
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
