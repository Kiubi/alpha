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
				type_label = "Commande à récupérer à l'adresse de la boutique";
				break;
			case 'socolissimo':
				type_label = "Options de livraison multiples (points relais, sur rendez-vous, etc.)";
				break;
			case 'local':
				type_label = "Commande envoyée à l'adresse de livraison (locale)";
				break;
			case 'tranchespoids':
				type_label = "Commande envoyée à l'adresse de livraison (nationale et internationale)";
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

var ListView = require('kiubi/views/ui/list.js');

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
