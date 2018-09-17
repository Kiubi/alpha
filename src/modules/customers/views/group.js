var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format.js');
var SelectView = require('kiubi/views/ui/select.js');
var ListView = require('./discounts.list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/group.html'),
	className: 'container',
	service: 'customers',

	behaviors: [FormBehavior],

	regions: {
		'type': {
			el: 'div[data-role="type"]',
			replaceElement: true
		},
		'page': {
			el: 'div[data-role="page"]',
			replaceElement: true
		},
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
		'is_enabled',
		'name',
		'target_type',
		'target_page',
		'discount'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'page', 'discount']);

		this.discounts = new Backbone.Collection();
		this.discounts.model = Backbone.Model.extend({
			defaults: {
				discount: null,
				group_discount: null,
				category_id: null,
				category_name: ''
			}
		});
		this.discounts.add(this.discount.get('categories'));
	},

	templateContext: function() {
		return {
			discount: format.formatFloat(this.discount.get('discount'))
		};
	},

	onRender: function() {
		this.showChildView('page', new SelectView({
			selected: this.model.get('target_page') + '@@' + this.model.get('target_key'),
			name: 'target_page'
		}));

		var types = this.page.getInternalLinkTypes().done(function() {
			this.changeType(this.model.get('target_type'));
		}.bind(this));

		this.showChildView('type', new SelectView({
			dataSource: types,
			selected: this.model.get('target_type'),
			name: 'target_type'
		}));

		this.showChildView('discounts', new ListView({
			collection: this.discounts
		}));
	},

	onChildviewChange: function(value, field) {
		if (field == 'target_type') this.changeType(value);
	},

	changeType: function(type) {

		this.getChildView('page').load(
			this.page.getInternalLinkTargets(type)
			.then(function(targets) {
				var options = _.map(targets, function(target) {
					var value = target.is_linkable ? target.target_page + '@@' + target.target_key : null;
					var indent = 0;
					if (target.depth && target.depth > 0) {
						indent += target.depth;
					}

					return {
						value: value,
						label: target.name,
						indent: type == 'cms' ? indent : null,
						is_group: !target.is_linkable
					};
				});
				return options;
			}, function() {
				// TODO
				return [];
			})
		);
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		// split page
		var s = data.target_page.split('@@', 2);
		data.target_page = s[0];
		data.target_key = s[1];

		// Discounts
		var collectionView = this.getChildView('discounts');
		var dataD = {};
		dataD.discount = (data.discount == '') ? null : data.discount;
		delete data.discount;
		dataD.categories = {};
		this.discounts.each(function(model) {
			var rowView = collectionView.children.findByModel(model);
			if (!rowView) return;
			if (rowView.getUI('discount').val() == '' || !model.get('category_id')) return;

			dataD.categories[model.get('category_id')] = rowView.getUI('discount').val();
		});

		return Backbone.$.when(
			this.model.save(
				data, {
					patch: true,
					wait: true
				}
			),
			this.discount.save(
				dataD, {
					patch: true,
					wait: true
				}
			)
		);
	},

	onDelete: function() {
		return this.model.destroy();
	}

});
