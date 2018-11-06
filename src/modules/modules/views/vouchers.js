var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/vouchers.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return (nb > 1 ? plural : singular).replace('%d', nb);
			},
			start_date: format.formatLongDate(this.model.get('start_date')),
			end_date: format.formatLongDate(this.model.get('end_date'))
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/vouchers.html'),
	className: 'container-fluid',
	service: 'modules',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	sortOrder: '-start_date',

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des bons de réduction',
			order: [{
				title: 'Date de validité',
				is_active: true,
				value: '-start_date'
			}, {
				title: 'Code',
				is_active: false,
				value: 'code'
			}],
			selection: [{
				title: 'Activer',
				callback: this.enableVouchers.bind(this)
			}, {
				title: 'Désactiver',
				callback: this.disableVouchers.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteVouchers.bind(this),
				confirm: true
			}]
		}));
	},

	start: function() {
		this.collection.fetch({
			reset: true,
			data: {
				sort: this.sortOrder ? this.sortOrder : null
			}
		});
	},

	enableVouchers: function(ids) {
		return this.collection.bulkEnable(ids);
	},

	disableVouchers: function(ids) {
		return this.collection.bulkDisable(ids);
	},

	deleteVouchers: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	}

});
