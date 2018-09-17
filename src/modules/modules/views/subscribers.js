var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
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

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: 'date',
	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.filters = {
			is_registered: null
		};
	},

	onRender: function() {

		var c = new CollectionUtils.SelectCollection();
		c.add([{
			'value': 'registred',
			'label': 'Inscrits',
			'selected': this.filters.is_registered == 'true'
		}, {
			'value': 'unregistred',
			'label': 'Désinscrits',
			'selected': this.filters.is_registered == 'false'
		}]);

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des abonnés à la newsletter',
			order: [{
				title: 'Inscription',
				is_active: true,
				value: 'date'
			}, {
				title: 'Email',
				is_active: false,
				value: 'email'
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
			filters: [{
				extraClassname: 'select-state',
				title: 'Tous les états',
				collectionPromise: c
			}]
		}));
	},

	start: function() {
		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.is_registered != null) {
			data.is_registered = this.filters.is_registered
		}

		this.collection.fetch({
			reset: true,
			data: data
		});
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
		if (filter.value == 'registred') {
			this.filters.is_registered = 'true';
		} else if (filter.value == 'unregistred') {
			this.filters.is_registered = 'false';
		} else {
			this.filters.is_registered = null;
		}
		this.start();
	},

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	}

});
