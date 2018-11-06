var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/posts.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	},

	templateContext: function() {
		return {
			label: this.model.getLabel(),
			showType: false,
			canMove: false
		};
	}

});
var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/posts.html'),
	className: 'container-fluid',
	service: 'cms',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);

		this.filters = {
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
		};
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des billets',
			selection: [{
				title: 'Afficher',
				callback: this.showPosts.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hidePosts.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deletePosts.bind(this),
				confirm: true
			}],
			filters: [{
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}]
		}));
	},

	start: function() {
		var data = {};
		if (this.filters.term != null) data.term = this.filters.term;

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	showPosts: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hidePosts: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		switch (filter.model.get('id')) {
			case 'term':
				this.onTermFilterChange(filter);
				break;
		}
	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();
	}

});
