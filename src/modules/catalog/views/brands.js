var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ListView = require('kiubi/core/views/ui/list.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Forms = require('kiubi/utils/forms.js');

var RowView = Marionette.View.extend({
	template: require('../templates/brands.row.html'),
	className: 'list-item',

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	},

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

		return this.model.save(
			Forms.extractFields(['name'], this), {
				patch: true,
				wait: true
			}
		).fail(function(xhr) {
			Forms.displayErrors(xhr, this.getUI('errors'), this.el);
		}.bind(this));
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/brands.html'),
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

			title: 'Liste des marques',
			selection: [{
				title: 'Supprimer',
				callback: this.deleteBrands.bind(this),
				confirm: true
			}]
		}));
	},

	start: function() {
		this.collection.fetch();
	},

	deleteBrands: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
