var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');

var ListView = require('./discounts.list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/discount.html'),
	className: 'container',
	service: 'customers',

	behaviors: [FormBehavior],

	regions: {
		discounts: {
			el: "div[data-role='discounts']",
			replaceElement: true
		}
	},

	ui: {
		'addDiscountBtn': 'a[data-role="discount-add"]'
	},

	events: {
		'click @ui.addDiscountBtn': function() {
			var m = new this.discounts.model({
				category_id: null,
				category_name: '-- Choisir une catégorie --'
			});
			this.discounts.add(m);
		}
	},

	fields: [
		'discount'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'customer']);

		this.discounts = new Backbone.Collection();
		this.discounts.model = Backbone.Model.extend({
			defaults: {
				discount: null,
				group_discount: null,
				category_id: null,
				category_name: ''
			}
		});
		this.discounts.add(this.model.get('categories'));
	},

	templateContext: function() {
		return {
			'group_name': this.customer.get('group_name'),
			'discount': format.formatFloat(this.model.get('discount')),
			'group_discount': format.formatFloat(this.model.get('group_discount'))
		};
	},

	onRender: function() {

		this.showChildView('discounts', new ListView({
			collection: this.discounts
		}));
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		var collectionView = this.getChildView('discounts');

		data.discount = (data.discount == '') ? null : data.discount;
		data.categories = {};
		this.discounts.each(function(model) {
			var rowView = collectionView.children.findByModel(model);
			if (!rowView) return;
			if (rowView.getUI('discount').val() == '' || !model.get('category_id')) return;

			data.categories[model.get('category_id')] = format.unformatFloat(rowView.getUI('discount').val());
		});

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	}

});
