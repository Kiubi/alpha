var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var VatBehavior = require('kiubi/behaviors/vat.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/carrier/steps.row.html'),
	className: 'list-item list-item-form',

	behaviors: [
		RowActionsBehavior,
		{
			behaviorClass: VatBehavior,
			proxy: 'taxesProxy'
		}
	],

	fields: [
		"price_ex_vat",
		"weight"
	],

	currency: '',

	initialize: function(options) {
		this.currency = options.currency || '';
	},

	templateContext: function() {
		return {
			price_ex_vat: format.formatFloat(this.model.get('price_ex_vat'), 4),
			price_inc_vat: format.formatFloat(this.model.get('price_inc_vat'), 4),
			weight: this.model.get('weight') > 0 ? format.formatFloat(this.model.get('weight') / 1000, 4) : '',
			currency: this.currency
		};
	},

	onActionDelete: function() {
		this.model.destroy();
	}

});

var EmptyView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Aucune tranche</span>'
	)
});

module.exports = Marionette.CollectionView.extend({
	className: '',
	emptyView: EmptyView,
	childView: RowView
});
