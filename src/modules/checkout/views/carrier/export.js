var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var format = require('kiubi/utils/format.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/carrier/export.html'),

	ui: {
		'exportSelect': 'select[data-role="export_type"]',
		'colishipForm': 'div[data-role="coliship"]',
		'dpdForm': 'div[data-role="dpd"]',
		'mrForm': 'div[data-role="mondialrelay"]'
	},

	events: {

		'change @ui.exportSelect': function(e) {
			var type = Backbone.$(e.currentTarget).val();
			switch (type) {
				default:
					this.getUI('colishipForm').hide();
					this.getUI('dpdForm').hide();
					this.getUI('mrForm').hide();
					break;
				case 'coliship':
					this.getUI('colishipForm').show();
					this.getUI('dpdForm').hide();
					this.getUI('mrForm').hide();
					break;
				case 'dpd':
					this.getUI('colishipForm').hide();
					this.getUI('dpdForm').show();
					this.getUI('mrForm').hide();
					break;
				case 'mondialrelay':
					this.getUI('colishipForm').hide();
					this.getUI('dpdForm').hide();
					this.getUI('mrForm').show();
					break;
			}
		}

	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	},

	templateContext: function() {
		return {
			'dpd_insurance_threshold': (this.model.get('dpd_insurance_threshold') !== '' || format.formatFloat(this.model.get('dpd_insurance_threshold'), 2) !== null) ? format.formatFloat(this.model.get('dpd_insurance_threshold'), 2) : '',
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onRender: function() {
		if (this.model.get('export_type') == 'coliship') {
			this.getUI('colishipForm').show();
		} else if (this.model.get('export_type') == 'dpd') {
			this.getUI('dpdForm').show();
		} else if (this.model.get('export_type') == 'mondialrelay') {
			this.getUI('mrForm').show();
		}
	}

});
