var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ListView = require('kiubi/core/views/ui/list.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Forms = require('kiubi/utils/forms.js');

var RowView = Marionette.View.extend({
	template: require('../templates/variants.row.html'),
	className: 'list-item',

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	behaviors: [RowActionsBehavior],

	onActionEdit: function() {
		this.getUI('list').hide();
		this.getUI('form').show();

	},
	onActionCancel: function() {
		this.getUI('form').hide();
		this.getUI('list').show();
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var data = Forms.extractFields(['name'], this);

		return this.model.rename(data.name).fail(function(xhr) {
			Forms.displayErrors(xhr, this.getUI('errors'), this.el);
		}.bind(this));
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/variants.html'),
	className: 'container',
	service: 'catalog',

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

			title: 'Liste des variantes'
		}));
	},

	start: function() {
		this.collection.fetch();
	}

});
