var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/payments.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {

		var type_label;
		switch (this.model.get('type')) {
			case 'virement':
				type_label = "Paiement par virement bancaire";
				break;
			case 'cm_cic':
				type_label =
					"Paiement par carte bancaire distribué par les banques : <br/> Crédit Mutuel (CyberMUT), OBC, Groupe CIC (P@iement CIC)";
				break;
			case 'paypal':
				type_label = "Paiement par PayPal";
				break;
			case 'paybox':
				type_label = "Solution de paiement en ligne sécurisée multi-banques";
				break;
			case 'atos':
				type_label =
					"Paiement par carte bancaire distribué par les banques : <br/> Société Générale (Sogénactif / Agora), Crédit Lyonnais (Sherlock), HSBC, CCF (Elysnet), Crédit du Nord (Webaffaires), La Poste (Scellius), Crédit Agricole (e-Transactions), BNP Paribas (Merc@net)";
				break;
			case 'cheque':
				type_label = "Paiement par chèque";
				break;
			case 'systempay':
				type_label =
					"Paiement par carte bancaire distribué par les banques : Banque Populaire (Cyberplus Paiement), Société générale (Sogecommerce)";
				break;
			case 'payline':
				type_label =
					"Paiement par carte bancaire distribué par : Crédits Mutuel de Bretagne, Crédits Mutuel du Sud Ouest et Arkéa (Citelis)";
				break;
			case 'payplug':
				type_label = "Solution de paiement en ligne sécurisée";
				break;
			case 'manuel':
				type_label = "Paiement générique par virement ou par chèque";
				break;
			default:
				break;
		}

		return {
			is_supported: this.model.isSupported(),
			type_label: type_label
		};
	}

});

var ListView = require('kiubi/core/views/ui/list.js');


module.exports = Marionette.View.extend({
	template: require('../templates/payments.html'),
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

			title: 'Liste des modes de paiement'
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
