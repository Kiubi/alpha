//var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var SelectView = require('kiubi/core/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: _.template('<label>Taxe</label><div data-role="taxes"></div>'),
	className: 'form-group',

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['taxes', 'selected']);
	},

	onRender: function() {

		var view = new SelectView({
			collection: this.taxes,
			selected: this.selected,
			name: 'tax_id'
		});

		if (this.taxes.length > 0) {
			this.onTaxChange(this.selected);
		} else {
			this.listenTo(view, 'load', this.onTaxChange);
		}
		this.listenTo(view, 'change', this.onTaxChange);

		this.showChildView('taxes', view);

	},

	onTaxChange: function(tax_id) {
		this.selected = tax_id;
		this.trigger('change', tax_id);
	}

});
