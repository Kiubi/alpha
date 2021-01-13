var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/carriers.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {

		var type_label;
		switch (this.model.get('type')) {
			case 'magasin':
				type_label = "Retrait en magasin pour le Click & Collect";
				break;
			case 'socolissimo':
				type_label = "Retrait en points relais ou sur rendez-vous du réseau La Poste";
				break;
			case 'soco_pickup':
				type_label = "Retrait en points relais La Poste";
				break;
			case 'local':
				type_label = "Livraison locale limitée à certain codes postaux";
				break;
			case 'tranchespoids':
				type_label = "Livraison nationale et internationale limitée à certain pays";
				break;
			case 'dpd':
				type_label = "Retrait en points relais du réseau DPD Relais Pickup";
				break;
			default:
				break;
		}

		return {
			is_supported: this.model.isSupported(),
			is_deletable: this.model.isDeletable(),
			type_label: type_label
		};
	},

	onActionDelete: function() {
		return this.model.destroy();
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/carriers.html'),
	className: 'container',
	service: 'checkout',

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

			title: 'Liste des transporteurs'
		}));
	},

	start: function() {
		this.collection.fetch({
			reset: true
		});
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(data.list);
	}

});
