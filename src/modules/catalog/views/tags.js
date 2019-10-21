var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ListView = require('kiubi/core/views/ui/list.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Forms = require('kiubi/utils/forms.js');

var RowView = Marionette.View.extend({
	template: require('../templates/tags.row.html'),
	className: 'list-item',

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}

	/*onActionEdit: function() {
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
			Forms.extractFields(['is_visible', 'comment'], this), {
				patch: true,
				wait: true
			}
		).fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
	}*/
});

module.exports = Marionette.View.extend({
	template: require('../templates/tags.html'),
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

			title: 'Liste des tags',
			selection: [{
				title: 'Supprimer',
				callback: this.deleteTags.bind(this),
				confirm: true
			}]
		}));
	},

	start: function() {
		this.collection.fetch();
	},

	deleteTags: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
