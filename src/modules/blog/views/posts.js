var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/posts.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return nb > 1 ? plural : singular;
			},
			publication_date: format.formatDate(this.model.get('publication_date')),
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/posts.html'),
	className: 'container-fluid',
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

			title: 'Liste des billets',
			order: [{
				title: 'Publication',
				is_active: true,
				data: {
					sort: '-publication'
				}
			}, {
				title: 'Modification',
				is_active: false,
				data: {
					sort: '-modification'
				}
			}],
			// TODO : filterModal: '#filtersblog',
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
				selectExtraClassname: 'select-category',
				title: 'Catégories',
				collection: this.getOption('categories'),
				selected: this.collection.category_id
			}]
		}));
	},

	start: function() {
		this.collection.fetch();
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

	onChildviewFilterChange: function(filter) {
		// Only one filter, so assume it is the category filter
		if (filter.value) {
			if (this.collection.category_id == filter.value) return;
			this.collection.category_id = filter.value;
		} else {
			if (this.collection.category_id == null) return;
			this.collection.category_id = null;
		}
		this.collection.fetch();
	}

});
