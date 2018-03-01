var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var _ = require('underscore');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var Forms = require('kiubi/utils/forms.js');


var NewRowView = Marionette.View.extend({
	template: require('../templates/comments.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]'
	},

	initialize: function(options) {
		this.mergeOptions(options);
	},

	templateContext: function() {
		return {
			comment_id: 'new'
		};
	},

	clearFields: function() {
		Backbone.$('textarea').val('');
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
		this.clearFields();
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var data = Forms.extractFields(['is_visible', 'comment'], this);
		data.post_id = this.getOption('post_id');

		var m = new this.collection.model();
		return m.save(data)
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
				this.clearFields();
			}.bind(this))
			.fail(function(xhr) {
				Forms.displayErrors(xhr, this.getUI('errors'), this.el);
			}.bind(this));
	},

	onActionShow: function() {
		this.getUI('form').show();
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/comments.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			date: format.formatDate(this.model.get('date')),
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

	enableAddComment: false,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'enableAddComment']);
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
			newRowView: this.enableAddComment ? NewRowView : null,
			childViewOptions: this.getOption('childViewOptions'),

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
