var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var format = require('kiubi/utils/format.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/aborted.row.html'),
	className: 'list-item visible-btn',

	behaviors: [RowActionsBehavior],

	templateContext: function() {

		var shipping = this.model.get('shipping');
		var scheduled_date;

		if (shipping.scheduled) {
			scheduled_date = shipping.scheduled.indexOf(' ') === -1 ? format.formatDate(shipping.scheduled) : format.formatLongDateTime(
				shipping.scheduled);
		}

		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			scheduled_date: scheduled_date
		};
	},

	onActionRestore: function() {
		this.model.restore().done(function() {
			this.model.collection.remove(this.model);
		}.bind(this)); // TODO fail
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/aborted.html'),
	className: 'container-fluid',
	service: 'checkout',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			title: 'Liste des commandes abandonnées'
		}));
	},

	start: function() {
		var data = {
			extra_fields: 'price_label'
		};

		this.collection.fetch({
			reset: true,
			data: data
		});
	}

});
