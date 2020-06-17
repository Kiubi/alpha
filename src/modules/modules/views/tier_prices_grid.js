var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var TagView = require('kiubi/core/views/ui/tag.search.js');
var SelectView = require('kiubi/core/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var format = require('kiubi/utils/format');


var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var RowView = Marionette.View.extend({
	template: require('../templates/tier_prices_grid.row.html'),
	className: 'list-item list-item-form',

	behaviors: [RowActionsBehavior],

	ui: {
		'discount': 'input[name="discount"]',
		'qt': 'input[name="qt"]',
	},

	events: {
		'input @ui.qt': function(e) {
			this.model.set('qt', e.currentTarget.value);
		},
		'input @ui.discount': function(e) {
			this.model.set('discount', e.currentTarget.value);
		},
	},

	templateContext: function() {
		return {
			'discount': format.formatFloat(this.model.get('discount'))
		};
	},

	onRender: function() {

	},

	onActionDelete: function() {
		this.model.destroy();
	},

	/*onChildviewInput: function(term, view) {
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
	}*/

});

var EmptyView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Aucune remise</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: '',
	emptyView: EmptyView,
	childView: RowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/tier_prices_grid.html'),
	className: 'container',
	service: 'modules',

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
				qt: null,
				discount: null
			});
			this.discounts.add(m);
		}
	},

	fields: [
		"name",
		"is_enabled"
	],

	discounts: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.discounts = new Backbone.Collection();
		this.discounts.model = Backbone.Model.extend({
			defaults: {
				discount: null,
				qt: null
			}
		});
		this.discounts.add(this.model.get('steps'));

	},

	onRender: function() {

		this.showChildView('discounts', new ListView({
			collection: this.discounts
		}));

	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);

		data.steps = this.discounts.length ? {} : ''; // hack for removing steps

		this.discounts.each(function(model) {
			if (model.get('qt') == '' || model.get('discount') == '') return;
			data.steps[model.get('qt')] = model.get('discount');
		});

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
