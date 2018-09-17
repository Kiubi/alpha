var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Forms = require('kiubi/utils/forms.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/fidelity.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior, SelectifyBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]',
		'sum': 'span[data-role="sum"]'
	},

	initialize: function() {
		this.listenTo(this.collection, 'update', this.updateTotal);
	},

	updateTotal: function() {
		var sum = this.collection.reduce(function(memo, model, i) {
			return memo + model.get('qt');
		}, 0);
		this.getUI('sum').text(sum);
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var data = Forms.extractFields(['qt', 'comment', 'operation'], this);

		return this.collection.createOperation(
			data.operation == 'sub' ? -1 * data.qt : data.qt,
			data.comment
		).done(function(operations) {
			this.getUI('form').hide();
			this.collection.add(operations);
		}.bind(this)).fail(function(xhr) {
			Forms.displayErrors(xhr, this.getUI('errors'), this.el);
		}.bind(this));
	},

	onActionShow: function() {
		Backbone.$('input').val('');
		this.getUI('form').show();
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/fidelity.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	ui: {
		'list': 'div[data-role="list"]'
	},

	templateContext: function() {
		return {
			end_date: this.model.get('end_date') ? format.formatLongDate(this.model.get('end_date')) : '',
			value_date: format.formatLongDate(this.model.get('value_date'))
		};
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/fidelity.html'),
	className: 'container',
	service: 'customers',

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
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

			title: 'Points de fidélité'
		}));
	},

	start: function() {
		this.collection.fetch();
	}
});
