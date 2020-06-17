var Marionette = require('backbone.marionette');

var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var format = require('kiubi/utils/format.js');

var TaxView = require('kiubi/modules/catalog/views/select.taxes.js');

module.exports = Marionette.View.extend({
	template: require('../../../templates/carrier/socolissimo/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	ui: {
		'delay': 'input[name="delay"]',
		'free_threshold': 'input[name="free_threshold"]'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes']);

		this.listenTo(this.model, 'change', function() {
			this.updateView();
		});
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
	},

	updateView: function() {
		this.model.hasChanged('free_threshold') && this.getUI('free_threshold').val(format.formatFloat(this.model.get(
			'free_threshold'), 2));
		if (this.model.hasChanged('delay')) this.getUI('delay').val(this.model.get('delay'));
	},

	extractFields: function() {
		return {
			free_threshold: this.getUI('free_threshold').val(),
			delay: this.getUI('delay').val()
		};
	}

});
