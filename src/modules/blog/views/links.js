var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Forms = require('kiubi/utils/forms.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/links.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]'
	},

	templateContext: function() {
		return {
			link_id: 'new'
		};
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var m = new this.collection.model();
		return m.save(
				Forms.extractFields(['is_enabled', 'url', 'name', 'description'], this))
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
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
	template: require('../templates/links.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

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
			Forms.extractFields(['is_enabled', 'url', 'name', 'description'], this), {
				patch: true,
				wait: true
			}
		).fail(function(xhr) {
			Forms.displayErrors(xhr, this.getUI('errors'), this.el);
		}.bind(this));
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/links.html'),
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
			newRowView: NewRowView,

			title: 'Liste des blogrolls',
			selection: [{
				title: 'Afficher',
				callback: this.showLinks.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideLinks.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteLinks.bind(this),
				confirm: true
			}]
		}));
	},

	showLinks: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hideLinks: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deleteLinks: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	start: function() {
		this.collection.fetch();
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(data.list);
	}
});
