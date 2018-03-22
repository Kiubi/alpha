var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/subscribers.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			subscription_date: format.formatDateTime(this.model.get('subscription_date'))
		};
	},

	behaviors: [RowActionsBehavior]
});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/subscribers.html'),
	className: 'container',
	service: 'modules',

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

			title: 'Liste des abonnés à la newsletter',
			order: [{
				title: 'Inscription',
				is_active: true,
				data: {
					sort: 'email'
				}
			}, {
				title: 'Email',
				is_active: false,
				data: {
					sort: 'date'
				}
			}],
			selection: [{
				title: 'Désinscrire',
				callback: this.unsubscribeEmail.bind(this)
			}, {
				title: 'Inscrire',
				callback: this.subscribeEmail.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteEmail.bind(this),
				confirm: true
			}],
			/*filters: [{
				selectExtraClassname: 'select-category',
				title: 'Toutes les catégories',
				collectionPromise: this.getOption('categories').promisedSelect(this.collection.category_id)
			}]*/
		}));
	},

	start: function() {
		this.collection.fetch();
	},

	subscribeEmail: function(ids) {
		return this.collection.bulkSubscribe(ids);
	},

	unsubscribeEmail: function(ids) {
		return this.collection.bulkUnsubscribe(ids);
	},

	deleteEmail: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewFilterChange: function(filter) {
		// Only one filter, so assume it is the category filter
		this.collection.fetch({
			data: {
				order: filter.value
			}
		});
	}

});
