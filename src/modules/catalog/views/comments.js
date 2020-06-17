var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/comments.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			date: format.formatLongDateTime(this.model.get('date')),
			comment2br: _.escape('' + this.model.get('comment')).replace(/(\r\n|\n\r|\r|\n)+/g, '<br />')
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



	onActionSave: function() {

		return this.model.save(
			Forms.extractFields(['is_visible', 'comment'], this), {
				patch: true,
				wait: true
			}
		).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/comments.html'),
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

			title: 'Liste des évaluations',
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

	start: function(params) {
		this.collection.fetch({
			data: params
		});
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
