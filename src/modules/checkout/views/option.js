var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var VatBehavior = require('kiubi/behaviors/vat.js');
var Forms = require('kiubi/utils/forms.js');
var SelectView = require('kiubi/core/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: require('../templates/option.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior, VatBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	fields: [
		"is_enabled",
		"name",
		"description",
		"tax_id",
		"price_ex_vat",
		"values"
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes']);
	},

	templateContext: function() {
		return {
			values: this.model.get('values') && _.isArray(this.model.get('values')) > 0 ? this.model.get('values').join(',') :
				'',
			price_ex_vat: format.formatFloat(this.model.get('price_ex_vat'), 4),
			price_inc_vat: format.formatFloat(this.model.get('price_inc_vat'), 4),
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onRender: function() {
		this.showChildView('taxes', new SelectView({
			collection: this.taxes,
			selected: this.model.get('tax_id'),
			name: 'tax_id'
		}));
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
