var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var format = require('kiubi/utils/format.js');

module.exports = Marionette.Behavior.extend({

	ui: {
		'price_vat': 'input[data-role="vat"]'
	},

	events: {
		'keyup @ui.price_vat': 'onPriceChange'
	},

	options: {
		proxy: null
	},

	rate: null,

	initialize: function() {
		this.rate = null;
	},

	onRender: function() {
		if (this.getOption('proxy')) {
			this.listenTo(this.view.getOption(this.getOption('proxy')), 'tax:change', this.onVATChange);
		} else {
			this.listenTo(this.view.getChildView('taxes'), 'change', this.taxesViewChange);
		}
	},

	/* Autodetect */

	taxesViewChange: function() {
		var rate = this.getCurrentTax();
		if (rate == null) return;

		this.onVATChange(rate);
	},

	getCurrentTax: function() {
		var tax;
		if (this.getOption('proxy')) {
			return this.view.getOption(this.getOption('proxy')).taxRate();
		}

		tax = this.view.taxes.get(this.view.getChildView('taxes').selected);
		if (tax) {
			return (1 + tax.get('vat_rate') / 100);
		}

		return null;
	},

	/* Handle Rate change */

	onVATChange: function(rate) {

		if (rate == null) return;

		if (this.rate == null) {
			this.rate = rate;
		}

		this.rate = rate;
		var view = this.view;

		this.getUI('price_vat').each(function() {

			if (this.name.match(/ex_vat(\[\])?$/) == null) {
				return;
			}

			var $inc = Backbone.$('input[name="' + Backbone.$(this).data('linked') + '"]', view.el);
			if (!$inc) return;

			var val = format.unformatFloat(this.value);
			if (val == null) {
				$inc.val('');
				return;
			}
			val *= rate;
			$inc.val(format.formatFloat(val, 4));
		});
	},

	onPriceChange: function(event) {

		if (this.rate == null) {
			this.rate = this.getCurrentTax();
		}

		var $linked = Backbone.$('input[name="' + Backbone.$(event.currentTarget).data('linked') + '"]', this.view.el);
		if (!$linked) return;

		var val = format.unformatFloat(event.currentTarget.value);
		if (val == null) {
			$linked.val('');
			return;
		}

		if (event.currentTarget.name.match(/ex_vat(\[\])?$/) != null) {
			val *= this.rate;
		} else {
			val /= this.rate;
		}
		$linked.val(format.formatFloat(val, 4));
	}

});
