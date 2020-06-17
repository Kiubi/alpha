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

	onActionSave: function() {

		var m = new this.collection.model();
		return m.save(
				Forms.extractFields(['is_enabled', 'url', 'name', 'description'], this))
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
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

	onActionSave: function() {

		return this.model.save(
			Forms.extractFields(['is_enabled', 'url', 'name', 'description'], this), {
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
