var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/customers.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {
		return {
			convertMediaPath: Session.convertMediaPath.bind(Session),
			plural: function(nb, singular, plural) {
				return (nb > 1 ? plural : singular).replace('%d', nb);
			},
			creation_date: format.formatLongDate(this.model.get('creation_date'))
		};
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/customers.html'),
	className: 'container-fluid',
	service: 'customers',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-date',

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

			title: 'Tous les membres',
			order: [{
				title: 'Nom',
				is_active: false,
				value: 'name'
			}, {
				title: 'Inscription',
				is_active: true,
				value: '-date'
			}],
			selection: [
				/*{
								title: 'Exporter',
								callback: this.exportCustomer.bind(this)
							},*/
				{
					title: 'Autoriser',
					callback: this.enableCustomer.bind(this)
				}, {
					title: 'Bloquer',
					callback: this.disableCustomer.bind(this)
				}, {
					title: 'Supprimer',
					callback: this.deleteCustomer.bind(this),
					confirm: true
				}
			],
			filters: [{
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}, {
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export',
					'label': 'Exporter les membres',
					'selected': false
				}])
			}]
		}));
	},

	start: function() {

		var data = {
			sort: this.sortOrder ? this.sortOrder : null,
			extra_fields: 'orders'
		};
		if (this.filters.term) data.term = this.filters.term;

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	/*exportCustomer: function(ids) {
		//return this.collection.bulkShow(ids);
	},*/

	enableCustomer: function(ids) {
		return this.collection.bulkEnable(ids);
	},

	disableCustomer: function(ids) {
		return this.collection.bulkDisable(ids);
	},

	deleteCustomer: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		switch (filter.model.get('id')) {
			case 'term':
				this.onTermFilterChange(filter);
				break;
			case 'export':
				this.onExportFilterChange(filter);
				break;
		}
	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
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
			if (this.filters.term != null) data.term = this.filters.term;

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
			}.bind(this)).fail(function(xhr) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(xhr);

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
	}

});
