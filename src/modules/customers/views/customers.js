var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

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
			}
		};
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/customers.html'),
	className: 'container-fluid',
	service: 'customers',

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

			title: 'Tous les membres',
			selection: [{
				title: 'Exporter',
				callback: this.exportCustomer.bind(this)
			}, {
				title: 'Autoriser',
				callback: this.enableCustomer.bind(this)
			}, {
				title: 'Bloquer',
				callback: this.disableCustomer.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteCustomer.bind(this),
				confirm: true
			}]
		}));
	},

	exportCustomer: function(ids) {
		//return this.collection.bulkShow(ids);
	},

	enableCustomer: function(ids) {
		return this.collection.bulkEnable(ids);
	},

	disableCustomer: function(ids) {
		return this.collection.bulkDisable(ids);
	},

	deleteCustomer: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	start: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'orders'
			}
		});
	}
});
