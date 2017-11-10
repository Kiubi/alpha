var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var Forms = require('kiubi/utils/forms.js');

var RowView = Marionette.View.extend({
	template: require('../templates/comments.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return nb > 1 ? plural : singular;
			},
			convertMediaPath: Session.convertMediaPath.bind(Session),
			date: format.formatDate(this.model.get('date'))
		};
	},

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
			Forms.extractFields(['is_visible', 'comment'], this), {
				patch: true,
				wait: true
			}
		).fail(function(xhr) {
			Forms.displayErrors(xhr, this.getUI('errors'), this.el);
		}.bind(this));
	}
});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/comments.html'),
	className: 'container',
	service: 'blog',

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

			title: 'Liste des commentaires',
			selection: [{
				title: 'Afficher',
				callback: this.showComments.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideComment.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteComments.bind(this),
				confirm: true
			}]
		}));
	},

	start: function() {
		this.collection.fetch();
	},

	showComments: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hideComment: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deleteComments: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
