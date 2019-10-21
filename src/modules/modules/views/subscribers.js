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
			subscription_date: format.formatLongDateTime(this.model.get('subscription_date'))
		};
	},

	behaviors: [RowActionsBehavior]
});

var ListView = require('kiubi/core/views/ui/list.js');

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

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des abonnés à la newsletter',
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
				id: 'registred',
				extraClassname: 'select-state',
				title: 'Tous les états',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'registred',
					'label': 'Inscrits',
					'selected': this.filters.is_registered == 'true'
				}, {
					'value': 'unregistred',
					'label': 'Désinscrits',
					'selected': this.filters.is_registered == 'false'
				}])
			}],
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export',
					'label': 'Exporter les abonnés',
					'selected': false
				}])
			}, {
				id: 'sort',
				extraClassname: 'md-sort',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					label: 'Inscription',
					selected: true,
					value: 'date'
				}, {
					label: 'Email',
					selected: false,
					value: 'email'
				}])
			}]

		}));
	},

	start: function() {
		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.is_registered != null) {
			data.is_registered = this.filters.is_registered;
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
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onRegistredFilterChange: function(filter) {
		if (filter.value == 'registred') {
			this.filters.is_registered = 'true';
		} else if (filter.value == 'unregistred') {
			this.filters.is_registered = 'false';
		} else {
			this.filters.is_registered = null;
		}
		this.start();
	},

	onExportFilterChange: function(filter) {
		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export') {

			if (view.collection.length > 1) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {};
			if (this.filters.is_registered != null) data.is_registered = this.filters.is_registered;

			this.collection.exportAll(data).done(function(data) {
				view.overrideExtraClassname('');
				view.collection.add([{
					value: null,
					label: '---'
				}, {
					value: data.url,
					label: 'Télécharger le fichier',
					extraClassname: 'md-export'
				}]);
				view.toggleDropdown(); // open
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);

				view.overrideExtraClassname('');
				while (view.collection.length > 1) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 1) {
				view.collection.pop();
			}
		}
	},

	onSortFilterChange: function(filter) {
		filter.view.activeItem(filter.value);
		this.sortOrder = filter.value;
		this.start();
	}

});
