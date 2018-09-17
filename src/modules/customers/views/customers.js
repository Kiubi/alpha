var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
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

var ListView = require('kiubi/views/ui/list.js');

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

	onChildviewFilterChange: function(filter) {
		if (filter.model.get('id') == 'term') {
			this.filters.term = filter.value != '' ? filter.value : null;
		}

		this.start();
	}

});
