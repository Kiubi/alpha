var Marionette = require('backbone.marionette');

var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var format = require('kiubi/utils/format.js');

var TaxView = require('kiubi/modules/catalog/views/select.taxes.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/carrier/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes']);
	},

	templateContext: function() {
		return {
			'threshold': format.formatFloat(this.model.get('threshold'), 2),
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onRender: function() {
		this.taxes.fetch().done(function() {

			if (this.taxes.length === 0) return;

			this.showChildView('taxes', new TaxView({
				taxes: this.taxes,
				selected: this.model.get('tax_id')
			}));

		}.bind(this));
	}

});
